// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, euint8, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ShieldFlowEscrow
 * @notice Confidential multi-party escrow with encrypted milestone amounts.
 *         Client, contractor, and optional auditor interact with fully encrypted
 *         balances and milestone allocations via Zama FHEVM.
 *
 * Phase 1: createEscrow, deposit, basic milestone release, ACL grants.
 * Phase 2: FHE condition checks, time-based logic, multi-sig approvals.
 * Phase 3: Auditor access, dispute resolution hooks.
 */
contract ShieldFlowEscrow is ZamaEthereumConfig {
    // ─── Enums ───────────────────────────────────────────────────────────────

    enum EscrowStatus {
        Pending,    // created, awaiting deposit
        Active,     // funded, milestones in progress
        Completed,  // all milestones released
        Disputed,   // under arbitration
        Cancelled   // refunded / aborted
    }

    enum MilestoneStatus {
        Pending,    // not yet started
        InProgress, // work submitted, awaiting approval
        Approved,   // client approved — ready for release
        Released,   // funds sent to contractor
        Disputed    // under review
    }

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Milestone {
        euint64        encryptedAmount;   // encrypted ETH amount (in wei, scaled to uint64)
        uint64         deadline;          // Unix timestamp deadline (plaintext for on-chain time checks)
        MilestoneStatus status;
        bool           clientApproved;
        bool           contractorSubmitted;
    }

    struct Escrow {
        address        client;
        address        contractor;
        address        auditor;           // optional — address(0) if none
        euint64        totalDeposit;      // encrypted total deposit
        euint64        releasedAmount;    // encrypted cumulative released
        EscrowStatus   status;
        uint256        createdAt;
        uint8          milestoneCount;
        mapping(uint8 => Milestone) milestones;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 private _nextEscrowId;

    mapping(uint256 => Escrow) private _escrows;

    // ─── Events ───────────────────────────────────────────────────────────────
    // NOTE: No encrypted handles emitted — emitting handles in public events leaks
    // ciphertext references. Only plaintext metadata is emitted.

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed client,
        address indexed contractor,
        uint8 milestoneCount
    );

    event EscrowDeposited(uint256 indexed escrowId);

    event MilestoneSubmitted(uint256 indexed escrowId, uint8 milestoneIndex);

    event MilestoneApproved(uint256 indexed escrowId, uint8 milestoneIndex);

    event MilestoneReleased(uint256 indexed escrowId, uint8 milestoneIndex);

    event EscrowCompleted(uint256 indexed escrowId);

    event EscrowCancelled(uint256 indexed escrowId);

    event AuditorGranted(uint256 indexed escrowId, address auditor);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyClient(uint256 escrowId) {
        require(_escrows[escrowId].client == msg.sender, "ShieldFlow: caller is not client");
        _;
    }

    modifier onlyContractor(uint256 escrowId) {
        require(_escrows[escrowId].contractor == msg.sender, "ShieldFlow: caller is not contractor");
        _;
    }

    modifier onlyClientOrAuditor(uint256 escrowId) {
        require(
            _escrows[escrowId].client == msg.sender || _escrows[escrowId].auditor == msg.sender,
            "ShieldFlow: caller is not client or auditor"
        );
        _;
    }

    modifier escrowActive(uint256 escrowId) {
        require(_escrows[escrowId].status == EscrowStatus.Active, "ShieldFlow: escrow not active");
        _;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Create a new confidential escrow with up to 10 milestones.
     * @param contractor    Address of the service provider.
     * @param auditor       Optional auditor address (pass address(0) for none).
     * @param milestoneCount Number of milestones (1–10).
     * @param deadlines     Array of Unix timestamps, one per milestone.
     * @return escrowId     The newly created escrow identifier.
     */
    function createEscrow(
        address contractor,
        address auditor,
        uint8 milestoneCount,
        uint64[] calldata deadlines
    ) external returns (uint256 escrowId) {
        require(contractor != address(0), "ShieldFlow: invalid contractor");
        require(contractor != msg.sender, "ShieldFlow: client cannot be contractor");
        require(milestoneCount >= 1 && milestoneCount <= 10, "ShieldFlow: milestones must be 1-10");
        require(deadlines.length == milestoneCount, "ShieldFlow: deadline count mismatch");

        escrowId = _nextEscrowId++;

        Escrow storage e = _escrows[escrowId];
        e.client = msg.sender;
        e.contractor = contractor;
        e.auditor = auditor;
        e.status = EscrowStatus.Pending;
        e.createdAt = block.timestamp;
        e.milestoneCount = milestoneCount;

        for (uint8 i = 0; i < milestoneCount; i++) {
            require(deadlines[i] > block.timestamp, "ShieldFlow: deadline must be in future");
            e.milestones[i].deadline = deadlines[i];
            e.milestones[i].status = MilestoneStatus.Pending;
        }

        emit EscrowCreated(escrowId, msg.sender, contractor, milestoneCount);
    }

    /**
     * @notice Deposit encrypted ETH amounts per milestone into the escrow.
     *         The caller must provide an encrypted total and per-milestone amounts.
     *         All amounts are encrypted — the contract stores ciphertext handles only.
     * @param escrowId          The escrow to fund.
     * @param encryptedTotal    Encrypted total deposit (externalEuint64 handle).
     * @param encMilestoneAmts  Array of encrypted amounts per milestone.
     * @param inputProof        ZK proof authorizing these encrypted inputs.
     *
     * NOTE: encMilestoneAmts.length must equal the escrow's milestoneCount.
     *       All amounts share a single inputProof batch (multi-add pattern).
     */
    function deposit(
        uint256 escrowId,
        externalEuint64 encryptedTotal,
        externalEuint64[] calldata encMilestoneAmts,
        bytes calldata inputProof
    ) external payable onlyClient(escrowId) {
        Escrow storage e = _escrows[escrowId];
        require(e.status == EscrowStatus.Pending, "ShieldFlow: already funded");
        require(encMilestoneAmts.length == e.milestoneCount, "ShieldFlow: milestone amount count mismatch");

        // Convert and verify encrypted total
        euint64 total = FHE.fromExternal(encryptedTotal, inputProof);
        e.totalDeposit = total;
        FHE.allowThis(e.totalDeposit);
        FHE.allow(e.totalDeposit, msg.sender);       // client can verify their deposit
        FHE.allow(e.totalDeposit, e.contractor);      // contractor can view total

        // Initialise released amount to zero
        e.releasedAmount = FHE.asEuint64(0);
        FHE.allowThis(e.releasedAmount);
        FHE.allow(e.releasedAmount, msg.sender);
        FHE.allow(e.releasedAmount, e.contractor);

        // Store encrypted milestone amounts
        for (uint8 i = 0; i < e.milestoneCount; i++) {
            euint64 amt = FHE.fromExternal(encMilestoneAmts[i], inputProof);
            e.milestones[i].encryptedAmount = amt;
            FHE.allowThis(e.milestones[i].encryptedAmount);
            FHE.allow(e.milestones[i].encryptedAmount, msg.sender);   // client
            FHE.allow(e.milestones[i].encryptedAmount, e.contractor); // contractor
            if (e.auditor != address(0)) {
                FHE.allow(e.milestones[i].encryptedAmount, e.auditor); // auditor (if set)
            }
        }

        e.status = EscrowStatus.Active;
        emit EscrowDeposited(escrowId);
    }

    /**
     * @notice Contractor submits a milestone as complete (signals readiness for approval).
     * @param escrowId       Target escrow.
     * @param milestoneIndex Milestone index (0-based).
     */
    function submitMilestone(
        uint256 escrowId,
        uint8 milestoneIndex
    ) external onlyContractor(escrowId) escrowActive(escrowId) {
        Escrow storage e = _escrows[escrowId];
        require(milestoneIndex < e.milestoneCount, "ShieldFlow: invalid milestone");
        Milestone storage m = e.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Pending || m.status == MilestoneStatus.InProgress, "ShieldFlow: already submitted");

        m.status = MilestoneStatus.InProgress;
        m.contractorSubmitted = true;

        emit MilestoneSubmitted(escrowId, milestoneIndex);
    }

    /**
     * @notice Client approves a submitted milestone, marking it ready for release.
     * @param escrowId       Target escrow.
     * @param milestoneIndex Milestone index (0-based).
     */
    function approveMilestone(
        uint256 escrowId,
        uint8 milestoneIndex
    ) external onlyClient(escrowId) escrowActive(escrowId) {
        Escrow storage e = _escrows[escrowId];
        require(milestoneIndex < e.milestoneCount, "ShieldFlow: invalid milestone");
        Milestone storage m = e.milestones[milestoneIndex];
        require(m.contractorSubmitted, "ShieldFlow: contractor has not submitted");
        require(m.status == MilestoneStatus.InProgress, "ShieldFlow: milestone not in progress");

        m.clientApproved = true;
        m.status = MilestoneStatus.Approved;

        emit MilestoneApproved(escrowId, milestoneIndex);
    }

    /**
     * @notice Release the encrypted amount for an approved milestone to the contractor.
     *         The released amount is accumulated in the encrypted releasedAmount handle.
     *         Overflow is guarded homomorphically with FHE.select.
     * @param escrowId       Target escrow.
     * @param milestoneIndex Milestone index (0-based).
     */
    function releaseMilestone(
        uint256 escrowId,
        uint8 milestoneIndex
    ) external onlyClient(escrowId) escrowActive(escrowId) {
        Escrow storage e = _escrows[escrowId];
        require(milestoneIndex < e.milestoneCount, "ShieldFlow: invalid milestone");
        Milestone storage m = e.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Approved, "ShieldFlow: milestone not approved");

        // Overflow-safe accumulation of released amount
        euint64 newReleased = FHE.add(e.releasedAmount, m.encryptedAmount);
        ebool didOverflow = FHE.lt(newReleased, e.releasedAmount);
        e.releasedAmount = FHE.select(didOverflow, e.releasedAmount, newReleased);

        // Re-grant ACL after state update (mandatory for new handle)
        FHE.allowThis(e.releasedAmount);
        FHE.allow(e.releasedAmount, e.client);
        FHE.allow(e.releasedAmount, e.contractor);
        if (e.auditor != address(0)) {
            FHE.allow(e.releasedAmount, e.auditor);
        }

        m.status = MilestoneStatus.Released;
        emit MilestoneReleased(escrowId, milestoneIndex);

        // Check if all milestones are released
        if (_allMilestonesReleased(escrowId)) {
            e.status = EscrowStatus.Completed;
            emit EscrowCompleted(escrowId);
        }
    }

    /**
     * @notice Grant an auditor read access to all encrypted handles in an escrow.
     *         Only the client can grant this — it is irreversible per-escrow.
     * @param escrowId Target escrow.
     * @param auditor  Address to grant auditor access.
     */
    function grantAuditorAccess(
        uint256 escrowId,
        address auditor
    ) external onlyClient(escrowId) {
        require(auditor != address(0), "ShieldFlow: invalid auditor address");
        Escrow storage e = _escrows[escrowId];
        require(e.status != EscrowStatus.Completed && e.status != EscrowStatus.Cancelled, "ShieldFlow: escrow closed");

        e.auditor = auditor;

        // Grant auditor read access to all existing encrypted handles
        FHE.allow(e.totalDeposit, auditor);
        FHE.allow(e.releasedAmount, auditor);
        for (uint8 i = 0; i < e.milestoneCount; i++) {
            if (FHE.isInitialized(e.milestones[i].encryptedAmount)) {
                FHE.allow(e.milestones[i].encryptedAmount, auditor);
            }
        }

        emit AuditorGranted(escrowId, auditor);
    }

    /**
     * @notice Cancel an escrow in Pending state (before funding). Only client can cancel.
     */
    function cancelEscrow(uint256 escrowId) external onlyClient(escrowId) {
        Escrow storage e = _escrows[escrowId];
        require(e.status == EscrowStatus.Pending, "ShieldFlow: can only cancel pending escrow");
        e.status = EscrowStatus.Cancelled;
        emit EscrowCancelled(escrowId);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Returns plaintext metadata about an escrow (no encrypted data exposed).
     */
    function getEscrowInfo(uint256 escrowId)
        external
        view
        returns (
            address client,
            address contractor,
            address auditor,
            EscrowStatus status,
            uint256 createdAt,
            uint8 milestoneCount
        )
    {
        Escrow storage e = _escrows[escrowId];
        return (e.client, e.contractor, e.auditor, e.status, e.createdAt, e.milestoneCount);
    }

    /**
     * @notice Returns the encrypted total deposit handle for an escrow.
     *         ACL-gated: only client/contractor/auditor can decrypt.
     */
    function getTotalDeposit(uint256 escrowId) external view returns (euint64) {
        return _escrows[escrowId].totalDeposit;
    }

    /**
     * @notice Returns the encrypted released amount handle for an escrow.
     *         ACL-gated: only client/contractor/auditor can decrypt.
     */
    function getReleasedAmount(uint256 escrowId) external view returns (euint64) {
        return _escrows[escrowId].releasedAmount;
    }

    /**
     * @notice Returns milestone metadata (plaintext status + deadline) and its encrypted amount handle.
     */
    function getMilestone(uint256 escrowId, uint8 milestoneIndex)
        external
        view
        returns (
            euint64 encryptedAmount,
            uint64  deadline,
            MilestoneStatus milestoneStatus,
            bool clientApproved,
            bool contractorSubmitted
        )
    {
        Milestone storage m = _escrows[escrowId].milestones[milestoneIndex];
        return (m.encryptedAmount, m.deadline, m.status, m.clientApproved, m.contractorSubmitted);
    }

    /**
     * @notice Returns the next escrow ID (useful for frontends to track IDs).
     */
    function nextEscrowId() external view returns (uint256) {
        return _nextEscrowId;
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────

    function _allMilestonesReleased(uint256 escrowId) internal view returns (bool) {
        Escrow storage e = _escrows[escrowId];
        for (uint8 i = 0; i < e.milestoneCount; i++) {
            if (e.milestones[i].status != MilestoneStatus.Released) {
                return false;
            }
        }
        return true;
    }
}
