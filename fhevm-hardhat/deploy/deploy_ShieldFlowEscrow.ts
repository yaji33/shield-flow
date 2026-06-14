import { ethers, network } from "hardhat";
import { mkdirSync, writeFileSync } from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n🛡  ShieldFlow — Deploying on network: ${network.name}`);
  console.log(`   Deployer: ${deployer.address}`);

  const Factory = await ethers.getContractFactory("ShieldFlowEscrow");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`   ✅ ShieldFlowEscrow deployed at: ${address}\n`);

  // Persist deployment info so the frontend can pick it up
  mkdirSync(`deployments/${network.name}`, { recursive: true });
  writeFileSync(
    `deployments/${network.name}/ShieldFlowEscrow.json`,
    JSON.stringify(
      {
        address,
        deployer: deployer.address,
        network: network.name,
        deployedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.log(`   📄 Deployment info saved to deployments/${network.name}/ShieldFlowEscrow.json`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
