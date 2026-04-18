import { Prisma, PrismaClient, Role, LeadStatus, RiskLevel, NotificationChannel } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@loanflow.tw' },
    update: {},
    create: {
      name: '系統管理員',
      email: 'admin@loanflow.tw',
      passwordHash: 'admin1234',
      role: Role.ADMIN
    }
  })

  const sales = await prisma.user.upsert({
    where: { email: 'sales@loanflow.tw' },
    update: {},
    create: {
      name: '業務專員',
      email: 'sales@loanflow.tw',
      passwordHash: 'sales1234',
      role: Role.SALES
    }
  })

  const leads = [
    {
      id: 'seed_lead_001',
      fullName: '王志明',
      phone: '0911222333',
      lineId: 'mingw2026',
      fundingNeed: 260000,
      fundingUse: '公司營運周轉',
      jobType: '上班族',
      monthlyIncome: 62000,
      hasPayroll: true,
      hasLaborInsurance: true,
      hasTaxRecords: true,
      hasCreditCard: true,
      hasRevolving: false,
      hasOtherLoans: false,
      monthlyDebtPayment: 8000,
      recentLatePayment: false,
      hasNegotiationOrBankruptcy: false,
      hasCar: false,
      hasHouse: false,
      hasGuarantor: false,
      status: LeadStatus.HIGH_INTENT,
      assignedSalesId: sales.id
    },
    {
      id: 'seed_lead_002',
      fullName: '林雅婷',
      phone: '0922333444',
      lineId: 'linyating_fin',
      fundingNeed: 1200000,
      fundingUse: '房屋裝修與債務整合',
      jobType: '自由工作者',
      monthlyIncome: 88000,
      hasPayroll: false,
      hasLaborInsurance: true,
      hasTaxRecords: true,
      hasCreditCard: true,
      hasRevolving: true,
      hasOtherLoans: true,
      monthlyDebtPayment: 38000,
      recentLatePayment: true,
      hasNegotiationOrBankruptcy: false,
      hasCar: true,
      hasHouse: true,
      hasGuarantor: true,
      status: LeadStatus.REVIEWING,
      assignedSalesId: sales.id
    },
    {
      id: 'seed_lead_003',
      fullName: '陳柏宇',
      phone: '0933555666',
      lineId: 'poyu_loan',
      fundingNeed: 90000,
      fundingUse: '短期資金需求',
      jobType: '餐飲業',
      monthlyIncome: 36000,
      hasPayroll: false,
      hasLaborInsurance: false,
      hasTaxRecords: false,
      hasCreditCard: false,
      hasRevolving: false,
      hasOtherLoans: false,
      monthlyDebtPayment: 3000,
      recentLatePayment: false,
      hasNegotiationOrBankruptcy: false,
      hasCar: true,
      hasHouse: false,
      hasGuarantor: false,
      status: LeadStatus.CONTACT_PENDING,
      assignedSalesId: null
    }
  ]

  for (const lead of leads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: lead,
      create: lead
    })
  }

  const lead1 = await prisma.lead.findUnique({ where: { id: 'seed_lead_001' } })
  const lead2 = await prisma.lead.findUnique({ where: { id: 'seed_lead_002' } })

  if (lead1) {
    await prisma.recommendation.upsert({
      where: { leadId: lead1.id },
      update: {
        primaryRecommendation: '信用貸款',
        secondaryRecommendation: '汽車貸款',
        riskLevel: RiskLevel.LOW,
        score: 88,
        reasons: ['收入穩定且有薪轉', '無近期遲繳紀錄'],
        requiredDocuments: ['薪轉證明', '身分證正反面'],
        needManualReview: false
      },
      create: {
        leadId: lead1.id,
        primaryRecommendation: '信用貸款',
        secondaryRecommendation: '汽車貸款',
        riskLevel: RiskLevel.LOW,
        score: 88,
        reasons: ['收入穩定且有薪轉', '無近期遲繳紀錄'],
        requiredDocuments: ['薪轉證明', '身分證正反面'],
        needManualReview: false
      }
    })
  }

  if (lead2) {
    await prisma.recommendation.upsert({
      where: { leadId: lead2.id },
      update: {
        primaryRecommendation: '人工覆核',
        secondaryRecommendation: '房屋二胎',
        riskLevel: RiskLevel.CRITICAL,
        score: 24,
        reasons: ['近期有遲繳紀錄', '存在卡循與負債壓力'],
        requiredDocuments: ['房屋權狀或土地登記謄本', '現有貸款清單', '收入證明'],
        needManualReview: true
      },
      create: {
        leadId: lead2.id,
        primaryRecommendation: '人工覆核',
        secondaryRecommendation: '房屋二胎',
        riskLevel: RiskLevel.CRITICAL,
        score: 24,
        reasons: ['近期有遲繳紀錄', '存在卡循與負債壓力'],
        requiredDocuments: ['房屋權狀或土地登記謄本', '現有貸款清單', '收入證明'],
        needManualReview: true
      }
    })
  }

  await prisma.leadAnswer.deleteMany({
    where: { leadId: { in: leads.map((lead) => lead.id) } }
  })

  for (const lead of leads) {
    const entries = Object.entries(lead).filter(
      ([key]) => !['id', 'status', 'assignedSalesId'].includes(key)
    )
    for (const [key, value] of entries) {
        await prisma.leadAnswer.create({
          data: {
            leadId: lead.id,
            key,
            value: value as Prisma.InputJsonValue
          }
        })
      }
    }

  await prisma.followUpLog.createMany({
    data: [
      {
        leadId: 'seed_lead_001',
        note: '已初步確認薪轉與工作年資，待補身分證與薪轉明細。',
        status: LeadStatus.HIGH_INTENT,
        createdBy: admin.id,
        userId: sales.id
      },
      {
        leadId: 'seed_lead_002',
        note: '有遲繳與卡循紀錄，需先人工覆核並評估房屋二胎或整合負債。',
        status: LeadStatus.REVIEWING,
        createdBy: admin.id,
        userId: admin.id
      }
    ]
  })

  await prisma.notificationLog.createMany({
    data: [
      {
        leadId: 'seed_lead_001',
        channel: NotificationChannel.EMAIL,
        target: 'crm@loanflow.tw',
        status: 'SKIPPED',
        message: 'Demo notification'
      },
      {
        leadId: 'seed_lead_001',
        channel: NotificationChannel.LINE,
        target: 'line-webhook',
        status: 'SKIPPED',
        message: 'Demo notification'
      }
    ]
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
