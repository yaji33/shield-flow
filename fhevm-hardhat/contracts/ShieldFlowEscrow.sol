// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, euint8, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ShieldFlowEscrow
 * @notice Confidential multi-party escrow with encrypted milestone amounts.
 *         Client, contractor, and optional auditor interact with fully encrypted
 *         balances and milestone allocations via Zama FHEVM.
 */
contract ShieldFlowEscrow is ZamaEthereumConfig {

    enum EscrowStatus {
        Pending,    
        Active,     
        Completed,  
        Disputed,   
        Cancelled   
    }

    enum MilestoneStatus {
        Pending,    
        InProgress, 
        Approved,  
        Released, 
        Disputed
    }

    struct Milestone {
        euint64         encryptedAmount;  
        uint256         plainAmountWei;    
        uint64          deadline; 
        MilestoneStatus status;
        bool            clientApproved;
        bool            contractorSubmitted;
    }

    struct Escrow {
        address        client;
        address        contractor;
        address        auditor;            // optional
        euint64        totalDeposit;      
        euint64        releasedAmount;    
        uint256        totalDepositWei;
        uint256        releasedWei; 
        uint256        pendingWithdrawal;
        EscrowStatus   status;
        uint256        createdAt;
        uint8          milestoneCount;
        mapping(uint8 => Milestone) milestones;
    }

    uint256 private _nextEscrowId;

    mapping(uint256 => Escrow) private _escrows;


    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed client,
        address indexed contractor,
        uint8 milestoneCount
    );

    event EscrowDeposited(uint256 indexed escrowId, uint256 totalWei);

    event MilestoneSubmitted(uint256 indexed escrowId, uint8 milestoneIndex);

    event MilestoneApproved(uint256 indexed escrowId, uint8 milestoneIndex);

    event MilestoneReleased(uint256 indexed escrowId, uint8 milestoneIndex, uint256 amountWei);

    event FundsWithdrawn(uint256 indexed escrowId, address indexed contractor, uint256 amountWei);

    event EscrowCompleted(uint256 indexed escrowId);

    event EscrowCancelled(uint256 indexed escrowId);

    event AuditorGranted(uint256 indexed escrowId, address auditor);

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

    // Core Functions 

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

    function deposit(
        uint256 escrowId,
        externalEuint64 encryptedTotal,
        externalEuint64[] calldata encMilestoneAmts,
        bytes calldata inputProof,
        uint256[] calldata milestoneAmountsWei
    ) external payable onlyClient(escrowId) {
        Escrow storage e = _escrows[escrowId];
        require(e.status == EscrowStatus.Pending, "ShieldFlow: already funded");
        require(encMilestoneAmts.length == e.milestoneCount, "ShieldFlow: milestone amount count mismatch");
        require(milestoneAmountsWei.length == e.milestoneCount, "ShieldFlow: plaintext amount count mismatch");
        require(msg.value > 0, "ShieldFlow: must send ETH");

        // Verify plaintext amounts sum to msg.value
        uint256 total = 0;
        for (uint8 i = 0; i < e.milestoneCount; i++) {
            total += milestoneAmountsWei[i];
        }
        require(total == msg.value, "ShieldFlow: plaintext amounts must sum to msg.value");

        euint64 encTotal = FHE.fromExternal(encryptedTotal, inputProof);
        e.totalDeposit = encTotal;
        FHE.allowThis(e.totalDeposit);
        FHE.allow(e.totalDeposit, msg.sender);
        FHE.allow(e.totalDeposit, e.contractor);

        e.releasedAmount = FHE.asEuint64(0);
        FHE.allowThis(e.releasedAmount);
        FHE.allow(e.releasedAmount, msg.sender);
        FHE.allow(e.releasedAmount, e.contractor);

        for (uint8 i = 0; i < e.milestoneCount; i++) {
            euint64 amt = FHE.fromExternal(encMilestoneAmts[i], inputProof);
            e.milestones[i].encryptedAmount = amt;
            FHE.allowThis(e.milestones[i].encryptedAmount);
            FHE.allow(e.milestones[i].encryptedAmount, msg.sender);
            FHE.allow(e.milestones[i].encryptedAmount, e.contractor);
            if (e.auditor != address(0)) {
                FHE.allow(e.milestones[i].encryptedAmount, e.auditor);
            }

            e.milestones[i].plainAmountWei = milestoneAmountsWei[i];
        }

        e.totalDepositWei = msg.value;
        e.status = EscrowStatus.Active;
        emit EscrowDeposited(escrowId, msg.value);
    }

    /**
     * @notice Contractor submits a milestone as complete.
     */
    function submitMilestone(
        uint256 escrowId,
        uint8 milestoneIndex
    ) external onlyContractor(escrowId) escrowActive(escrowId) {
        Escrow storage e = _escrows[escrowId];
        require(milestoneIndex < e.milestoneCount, "ShieldFlow: invalid milestone");
        Milestone storage m = e.milestones[milestoneIndex];
        require(
            m.status == MilestoneStatus.Pending || m.status == MilestoneStatus.InProgress,
            "ShieldFlow: already submitted"
        );

        m.status = MilestoneStatus.InProgress;
        m.contractorSubmitted = true;

        emit MilestoneSubmitted(escrowId, milestoneIndex);
    }

    /**
     * @notice Client approves a submitted milestone, marking it ready for release.
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


    function releaseMilestone(
        uint256 escrowId,
        uint8 milestoneIndex
    ) external onlyClient(escrowId) escrowActive(escrowId) {
        Escrow storage e = _escrows[escrowId];
        require(milestoneIndex < e.milestoneCount, "ShieldFlow: invalid milestone");
        Milestone storage m = e.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Approved, "ShieldFlow: milestone not approved");

        uint256 amountWei = m.plainAmountWei;
        require(amountWei > 0, "ShieldFlow: milestone has no plaintext amount");

        euint64 newReleased = FHE.add(e.releasedAmount, m.encryptedAmount);
        ebool didOverflow = FHE.lt(newReleased, e.releasedAmount);
        e.releasedAmount = FHE.select(didOverflow, e.releasedAmount, newReleased);

        FHE.allowThis(e.releasedAmount);
        FHE.allow(e.releasedAmount, e.client);
        FHE.allow(e.releasedAmount, e.contractor);
        if (e.auditor != address(0)) {
            FHE.allow(e.releasedAmount, e.auditor);
        }

        e.releasedWei += amountWei;
        e.pendingWithdrawal += amountWei;

        m.status = MilestoneStatus.Released;
        emit MilestoneReleased(escrowId, milestoneIndex, amountWei);

        if (_allMilestonesReleased(escrowId)) {
            e.status = EscrowStatus.Completed;
            emit EscrowCompleted(escrowId);
        }
    }

    function withdrawReleased(uint256 escrowId) external {
        Escrow storage e = _escrows[escrowId];
        require(e.contractor == msg.sender, "ShieldFlow: caller is not contractor");
        uint256 amount = e.pendingWithdrawal;
        require(amount > 0, "ShieldFlow: nothing to withdraw");

        e.pendingWithdrawal = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "ShieldFlow: ETH transfer failed");

        emit FundsWithdrawn(escrowId, msg.sender, amount);
    }

    /**
     * @notice Grant an auditor read access to all encrypted handles in an escrow.
     */
    function grantAuditorAccess(
        uint256 escrowId,
        address auditor
    ) external onlyClient(escrowId) {
        require(auditor != address(0), "ShieldFlow: invalid auditor address");
        Escrow storage e = _escrows[escrowId];
        require(
            e.status != EscrowStatus.Completed && e.status != EscrowStatus.Cancelled,
            "ShieldFlow: escrow closed"
        );

        e.auditor = auditor;

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
     * @notice Cancel an escrow in Pending state and refund the client if needed.
     */
    function cancelEscrow(uint256 escrowId) external onlyClient(escrowId) {
        Escrow storage e = _escrows[escrowId];
        require(e.status == EscrowStatus.Pending, "ShieldFlow: can only cancel pending escrow");
        e.status = EscrowStatus.Cancelled;
        emit EscrowCancelled(escrowId);
    }

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
     * @notice Returns plaintext Wei balances for an escrow.
     */
    function getEscrowBalances(uint256 escrowId)
        external
        view
        returns (
            uint256 totalDepositWei,
            uint256 releasedWei,
            uint256 pendingWithdrawal
        )
    {
        Escrow storage e = _escrows[escrowId];
        return (e.totalDepositWei, e.releasedWei, e.pendingWithdrawal);
    }

    function getTotalDeposit(uint256 escrowId) external view returns (euint64) {
        return _escrows[escrowId].totalDeposit;
    }

    function getReleasedAmount(uint256 escrowId) external view returns (euint64) {
        return _escrows[escrowId].releasedAmount;
    }

    function getMilestone(uint256 escrowId, uint8 milestoneIndex)
        external
        view
        returns (
            euint64         encryptedAmount,
            uint256         plainAmountWei,
            uint64          deadline,
            MilestoneStatus milestoneStatus,
            bool            clientApproved,
            bool            contractorSubmitted
        )
    {
        Milestone storage m = _escrows[escrowId].milestones[milestoneIndex];
        return (
            m.encryptedAmount,
            m.plainAmountWei,
            m.deadline,
            m.status,
            m.clientApproved,
            m.contractorSubmitted
        );
    }

    function nextEscrowId() external view returns (uint256) {
        return _nextEscrowId;
    }

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
