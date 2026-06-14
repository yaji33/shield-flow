import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { FhevmType } from "@fhevm/mock-utils";
import type { Signer } from "ethers";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Encrypt multiple uint64 values in a single batch for a contract call.
 * Uses hre.fhevm (mock coprocessor) — no remote relayer needed in tests.
 */
async function enc64Multi(
  contractAddress: string,
  signer: Signer,
  values: bigint[],
): Promise<{ handles: string[]; inputProof: string }> {
  const input = hre.fhevm.createEncryptedInput(contractAddress, await signer.getAddress());
  for (const v of values) {
    input.add64(v);
  }
  const result = await input.encrypt();
  const handles = result.handles.map((h) => ethers.hexlify(h));
  const inputProof = ethers.hexlify(result.inputProof);
  return { handles, inputProof };
}

function futureTs(offsetSeconds: number): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + offsetSeconds);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ShieldFlowEscrow — Phase 1", function () {
  let contract: Awaited<ReturnType<typeof ethers.getContractAt>>;
  let contractAddress: string;
  let client: Signer;
  let contractor: Signer;
  let auditor: Signer;
  let stranger: Signer;

  before(async function () {
    [client, contractor, auditor, stranger] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("ShieldFlowEscrow");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  // ── createEscrow ────────────────────────────────────────────────────────────

  describe("createEscrow", function () {
    it("should create a single-milestone escrow and emit EscrowCreated", async function () {
      const deadlines = [futureTs(3600)];
      const tx = await contract
        .connect(client)
        .createEscrow(await contractor.getAddress(), ethers.ZeroAddress, 1, deadlines);
      const receipt = await tx.wait();

      const event = receipt!.logs
        .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === "EscrowCreated");

      expect(event).to.not.be.undefined;
      expect(event!.args.milestoneCount).to.equal(1);
      expect(event!.args.client).to.equal(await client.getAddress());
      expect(event!.args.contractor).to.equal(await contractor.getAddress());
    });

    it("should create a 3-milestone escrow", async function () {
      const deadlines = [futureTs(1000), futureTs(2000), futureTs(3000)];
      await expect(
        contract.connect(client).createEscrow(await contractor.getAddress(), ethers.ZeroAddress, 3, deadlines),
      ).to.not.be.reverted;
    });

    it("should revert if client == contractor", async function () {
      await expect(
        contract.connect(client).createEscrow(await client.getAddress(), ethers.ZeroAddress, 1, [futureTs(3600)]),
      ).to.be.revertedWith("ShieldFlow: client cannot be contractor");
    });

    it("should revert if milestoneCount is 0", async function () {
      await expect(
        contract.connect(client).createEscrow(await contractor.getAddress(), ethers.ZeroAddress, 0, []),
      ).to.be.revertedWith("ShieldFlow: milestones must be 1-10");
    });

    it("should revert if milestoneCount > 10", async function () {
      const dls = Array.from({ length: 11 }, (_, i) => futureTs(1000 * (i + 1)));
      await expect(
        contract.connect(client).createEscrow(await contractor.getAddress(), ethers.ZeroAddress, 11, dls),
      ).to.be.revertedWith("ShieldFlow: milestones must be 1-10");
    });

    it("should revert if deadline count mismatches milestoneCount", async function () {
      await expect(
        contract.connect(client).createEscrow(await contractor.getAddress(), ethers.ZeroAddress, 2, [futureTs(3600)]),
      ).to.be.revertedWith("ShieldFlow: deadline count mismatch");
    });

    it("should return sequential escrow IDs", async function () {
      const dl = [futureTs(3600)];
      const contractorAddr = await contractor.getAddress();
      await contract.connect(client).createEscrow(contractorAddr, ethers.ZeroAddress, 1, dl);
      await contract.connect(client).createEscrow(contractorAddr, ethers.ZeroAddress, 1, dl);
      const nextId = await contract.nextEscrowId();
      expect(nextId).to.equal(2n);
    });
  });

  // ── deposit ─────────────────────────────────────────────────────────────────

  describe("deposit", function () {
    let escrowId: bigint;

    beforeEach(async function () {
      const tx = await contract
        .connect(client)
        .createEscrow(await contractor.getAddress(), ethers.ZeroAddress, 1, [futureTs(3600)]);
      const receipt = await tx.wait();
      const event = receipt!.logs
        .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === "EscrowCreated");
      escrowId = event!.args.escrowId;
    });

    it("should fund a single-milestone escrow with encrypted amounts", async function () {
      const total = 1000n;
      const amounts = [1000n];

      const { handles, inputProof } = await enc64Multi(contractAddress, client, [total, ...amounts]);
      const [totalHandle, ...milestoneHandles] = handles;

      await expect(
        contract.connect(client).deposit(escrowId, totalHandle, milestoneHandles, inputProof),
      )
        .to.emit(contract, "EscrowDeposited")
        .withArgs(escrowId);
    });

    it("should reject deposit from a non-client address", async function () {
      const { handles, inputProof } = await enc64Multi(contractAddress, stranger, [100n, 100n]);
      await expect(
        contract.connect(stranger).deposit(escrowId, handles[0], [handles[1]], inputProof),
      ).to.be.revertedWith("ShieldFlow: caller is not client");
    });

    it("should revert on double-deposit", async function () {
      const { handles, inputProof } = await enc64Multi(contractAddress, client, [100n, 100n]);
      await contract.connect(client).deposit(escrowId, handles[0], [handles[1]], inputProof);

      const { handles: h2, inputProof: p2 } = await enc64Multi(contractAddress, client, [100n, 100n]);
      await expect(
        contract.connect(client).deposit(escrowId, h2[0], [h2[1]], p2),
      ).to.be.revertedWith("ShieldFlow: already funded");
    });
  });

  // ── milestone flow ──────────────────────────────────────────────────────────

  describe("Milestone submit → approve → release flow", function () {
    let escrowId: bigint;

    beforeEach(async function () {
      const tx = await contract
        .connect(client)
        .createEscrow(await contractor.getAddress(), ethers.ZeroAddress, 2, [futureTs(3600), futureTs(7200)]);
      const receipt = await tx.wait();
      const event = receipt!.logs
        .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === "EscrowCreated");
      escrowId = event!.args.escrowId;

      // Fund the escrow (total=600, m0=400, m1=200)
      const { handles, inputProof } = await enc64Multi(contractAddress, client, [600n, 400n, 200n]);
      await contract.connect(client).deposit(escrowId, handles[0], [handles[1], handles[2]], inputProof);
    });

    it("contractor can submit, client can approve, client can release milestone 0", async function () {
      await expect(contract.connect(contractor).submitMilestone(escrowId, 0))
        .to.emit(contract, "MilestoneSubmitted")
        .withArgs(escrowId, 0);

      await expect(contract.connect(client).approveMilestone(escrowId, 0))
        .to.emit(contract, "MilestoneApproved")
        .withArgs(escrowId, 0);

      await expect(contract.connect(client).releaseMilestone(escrowId, 0))
        .to.emit(contract, "MilestoneReleased")
        .withArgs(escrowId, 0);
    });

    it("should emit EscrowCompleted when all milestones are released", async function () {
      for (const i of [0, 1]) {
        await contract.connect(contractor).submitMilestone(escrowId, i);
        await contract.connect(client).approveMilestone(escrowId, i);
      }
      await contract.connect(client).releaseMilestone(escrowId, 0);
      await expect(contract.connect(client).releaseMilestone(escrowId, 1))
        .to.emit(contract, "EscrowCompleted")
        .withArgs(escrowId);
    });

    it("should revert if contractor tries to approve milestone", async function () {
      await contract.connect(contractor).submitMilestone(escrowId, 0);
      await expect(
        contract.connect(contractor).approveMilestone(escrowId, 0),
      ).to.be.revertedWith("ShieldFlow: caller is not client");
    });

    it("should revert release if milestone not approved", async function () {
      await contract.connect(contractor).submitMilestone(escrowId, 0);
      await expect(
        contract.connect(client).releaseMilestone(escrowId, 0),
      ).to.be.revertedWith("ShieldFlow: milestone not approved");
    });

    it("should revert if stranger submits milestone", async function () {
      await expect(
        contract.connect(stranger).submitMilestone(escrowId, 0),
      ).to.be.revertedWith("ShieldFlow: caller is not contractor");
    });
  });

  // ── ACL ─────────────────────────────────────────────────────────────────────

  describe("ACL — encrypted handle access", function () {
    let escrowId: bigint;

    beforeEach(async function () {
      const tx = await contract
        .connect(client)
        .createEscrow(await contractor.getAddress(), ethers.ZeroAddress, 1, [futureTs(3600)]);
      const receipt = await tx.wait();
      const event = receipt!.logs
        .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === "EscrowCreated");
      escrowId = event!.args.escrowId;

      const { handles, inputProof } = await enc64Multi(contractAddress, client, [500n, 500n]);
      await contract.connect(client).deposit(escrowId, handles[0], [handles[1]], inputProof);
    });

    it("client should have ACL access to totalDeposit handle", async function () {
      const handle = await contract.getTotalDeposit(escrowId);
      expect(handle).to.not.equal(ethers.ZeroHash);
    });

    it("auditor should receive ACL access after grantAuditorAccess", async function () {
      const auditorAddr = await auditor.getAddress();
      await expect(contract.connect(client).grantAuditorAccess(escrowId, auditorAddr))
        .to.emit(contract, "AuditorGranted")
        .withArgs(escrowId, auditorAddr);

      const [, , storedAuditor] = await contract.getEscrowInfo(escrowId);
      expect(storedAuditor).to.equal(auditorAddr);
    });

    it("stranger should not be able to grant auditor access", async function () {
      await expect(
        contract.connect(stranger).grantAuditorAccess(escrowId, await auditor.getAddress()),
      ).to.be.revertedWith("ShieldFlow: caller is not client");
    });

    it("client can decrypt the totalDeposit handle via mock coprocessor", async function () {
      const handle = await contract.getTotalDeposit(escrowId);
      const decrypted = await hre.fhevm.userDecryptEuint(
        FhevmType.euint64,
        handle,
        contractAddress,
        client as any,
      );
      expect(decrypted).to.equal(500n);
    });
  });

  // ── cancelEscrow ────────────────────────────────────────────────────────────

  describe("cancelEscrow", function () {
    it("client can cancel a pending escrow", async function () {
      const tx = await contract
        .connect(client)
        .createEscrow(await contractor.getAddress(), ethers.ZeroAddress, 1, [futureTs(3600)]);
      const receipt = await tx.wait();
      const event = receipt!.logs
        .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === "EscrowCreated");
      const escrowId = event!.args.escrowId;

      await expect(contract.connect(client).cancelEscrow(escrowId))
        .to.emit(contract, "EscrowCancelled")
        .withArgs(escrowId);
    });

    it("cannot cancel an active escrow", async function () {
      const tx = await contract
        .connect(client)
        .createEscrow(await contractor.getAddress(), ethers.ZeroAddress, 1, [futureTs(3600)]);
      const receipt = await tx.wait();
      const event = receipt!.logs
        .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === "EscrowCreated");
      const escrowId = event!.args.escrowId;

      const { handles, inputProof } = await enc64Multi(contractAddress, client, [100n, 100n]);
      await contract.connect(client).deposit(escrowId, handles[0], [handles[1]], inputProof);

      await expect(
        contract.connect(client).cancelEscrow(escrowId),
      ).to.be.revertedWith("ShieldFlow: can only cancel pending escrow");
    });
  });
});
