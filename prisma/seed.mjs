import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const findOrCreate = async (model, where, data) => {
  const existing = await model.findFirst({ where });
  if (existing) return existing;
  return model.create({ data });
};

async function main() {
  const agent = await prisma.agent.upsert({
    where: { email: "agent@surelm.local" },
    update: { name: "Field Agent", role: "AGENT", territoryCode: "PB-01" },
    create: {
      email: "agent@surelm.local",
      name: "Field Agent",
      phone: "+910000000000",
      role: "AGENT",
      territoryCode: "PB-01",
    },
  });

  const customer = await findOrCreate(prisma.customer, { primaryPhone: "+910000000001" }, {
    fullName: "Sample Livestock Owner",
    primaryPhone: "+910000000001",
    village: "Sample Village",
    district: "Sample District",
    state: "PB",
    customerType: "INDIVIDUAL",
  });

  const institute = await findOrCreate(prisma.institute, { name: "Sample Tagging Institute" }, {
    name: "Sample Tagging Institute",
    contactPerson: "Institute Contact",
    contactPhone: "+910000000002",
    district: "Sample District",
    state: "PB",
    serviceAreaSummary: "Seeded referral destination for pilots",
  });

  for (const institute of [
    {
      name: "GVI - PB-01 Bhuvanagudi",
      contactPerson: "Mohan R. - Field Officer",
      contactPhone: "+910000000003",
      email: "vd.pb01@surelm.local",
      district: "Sample District",
      state: "PB",
      serviceAreaSummary: "Tagging and RFID ear-tag services for PB-01 villages",
    },
    {
      name: "GVDS - PB-02 Murtijapur",
      contactPerson: "Sunita K. - Field Officer",
      contactPhone: "+910000000004",
      email: "vd.pb02@surelm.local",
      district: "Sample District",
      state: "PB",
      serviceAreaSummary: "Ear-tag identification for PB-02 villages",
    },
    {
      name: "Sambalpur District Veterinary Dispensary",
      contactPerson: "Arjun P. - Division Officer",
      contactPhone: "+910000000005",
      district: "Sambalpur",
      state: "OD",
      serviceAreaSummary: "Division-level tagging services for eastern villages",
    },
  ]) {
    await findOrCreate(prisma.institute, { name: institute.name }, institute);
  }

  const livestock = await findOrCreate(
    prisma.livestockRecord,
    { customerId: customer.id, species: "CATTLE" },
    { customerId: customer.id, species: "CATTLE", breed: "HOLSTEIN", ageMonths: 36 },
  );

  await prisma.livestockIdentifier.upsert({
    where: { livestockRecordId: livestock.id },
    update: { idStatus: "ABSENT" },
    create: { livestockRecordId: livestock.id, idStatus: "ABSENT" },
  });

  const product = await prisma.insuranceProduct.upsert({
    where: { code: "CATTLE-BASIC-V1" },
    update: { name: "Cattle Basic Cover", active: true },
    create: {
      code: "CATTLE-BASIC-V1",
      name: "Cattle Basic Cover",
      insurerName: "Sample Insurer",
      version: 1,
      description: "Seeded baseline product for contract-freeze verification",
    },
  });

  await prisma.insurerConstraint.upsert({
    where: { productId_version: { productId: product.id, version: 1 } },
    update: {},
    create: {
      productId: product.id,
      version: 1,
      requiresTagForSubmission: false,
      allowsPendingTaggingInspection: true,
      requiresTagForIssuance: true,
      requiresVhc: true,
      vhcRequirementsJson: JSON.stringify(["vetLicenseNumber", "dentitionAge", "milkYield"]),
    },
  });

  await prisma.ruleVersion.upsert({
    where: { productId_version: { productId: product.id, version: 1 } },
    update: {},
    create: {
      productId: product.id,
      version: 1,
      rulesJson: JSON.stringify({ minAgeMonths: 12, maxAgeMonths: 144 }),
    },
  });

  await findOrCreate(prisma.productRule, { productId: product.id, ruleKey: "MIN_AGE_MONTHS" }, {
    productId: product.id,
    ruleType: "ELIGIBILITY",
    ruleKey: "MIN_AGE_MONTHS",
    conditionsJson: JSON.stringify({ minAgeMonths: 12 }),
  });

  await findOrCreate(
    prisma.checklistTemplate,
    { productId: product.id, version: 1, title: "Cattle Basic Baseline" },
    {
      productId: product.id,
      version: 1,
      title: "Cattle Basic Baseline",
      itemsConfigJson: JSON.stringify([
        "ANIMAL_FULL_BODY_PHOTO",
        "EAR_TAG_PHOTO",
        "ANIMAL_WITH_OWNER_PHOTO",
        "VHC",
        "KYC_IDENTITY_PROOF",
      ]),
    },
  );

  await prisma.promptMetadata.upsert({
    where: { promptKey_promptVersion: { promptKey: "surelm.mock.v1", promptVersion: "2026-11-20.1" } },
    update: {},
    create: {
      promptKey: "surelm.mock.v1",
      promptVersion: "2026-11-20.1",
      modelVersion: "mock-model-1",
      provider: "MOCK",
    },
  });

  await prisma.adminConfig.upsert({
    where: { key: "livestock.breeds" },
    update: {},
    create: { key: "livestock.breeds", valueJson: JSON.stringify(["HOLSTEIN", "JERSEY", "LOCAL"]) },
  });

  await prisma.adminConfig.upsert({
    where: { key: "mvp.baseline" },
    update: {},
    create: { key: "mvp.baseline", valueJson: JSON.stringify({ version: 1, branchModel: "dev/ai + dev/platform" }) },
  });

  process.stdout.write(
    `Seeded agent=${agent.id} customer=${customer.id} institute=${institute.id} product=${product.id}\n`,
  );
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
