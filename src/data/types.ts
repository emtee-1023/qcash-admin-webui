export type BusinessStatus = 'pending' | 'active' | 'suspended' | 'closed'
export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type Role = 'Admin' | 'Customer'

export type BusinessOwner = {
  id: number
  userId: number
  name: string
  email: string | null
  phone: string | null
  role: string
  isPrimary: boolean
  status: 'active' | 'suspended'
}

export type PaymentAccount = {
  id: number
  provider: string
  channelType: string
  accountReference: string | null
  accountName: string | null
  status: string
  verifiedAt: string | null
}

export type Business = {
  id: number
  publicId: string
  name: string
  businessTypeId: number | null
  businessType: string
  businessCategory: string | null
  registrationNumber: string | null
  phone: string | null
  email: string | null
  hasPhysicalLocation: boolean
  countyId: number | null
  subCountyId: number | null
  wardId: number | null
  county: string | null
  town: string | null
  ward: string | null
  physicalAddress: string | null
  operatingSince: string | null
  status: BusinessStatus
  kycStatus: KycStatus
  collectionAccount: string | null
  paybillNumber: string | null
  walletBalanceMinor: number
  createdAt: string | null
  updatedAt: string | null
  owners: BusinessOwner[]
  paymentAccounts: PaymentAccount[]
}

export type AdminUser = {
  id: number
  name: string
  email: string | null
  emailVerifiedAt: string | null
  phone: string | null
  phoneVerifiedAt: string | null
  idType: string | null
  identificationNumber: string | null
  dateOfBirth: string | null
  isAdmin: boolean
  adminActivatedAt: string | null
  role: Role
  businessesCount: number
  createdAt: string | null
  updatedAt: string | null
}

export type LendingSummary = {
  loansCount: number
  disbursedLoansCount: number
  activeLoansCount: number
  overdueLoansCount: number
  settledLoansCount: number
  defaultedLoansCount: number
  principalMinor: number
  disbursedPrincipalMinor: number
  feesMinor: number
  totalRepayableMinor: number
  repaidMinor: number
  feeRepaidMinor: number
  principalRepaidMinor: number
  outstandingMinor: number
  averageAprBps: number
  weightedAprBps: number
}

export type Loan = {
  id: number
  publicId: string
  businessId: number
  principalMinor: number
  feeMinor: number
  totalRepayableMinor: number
  amountRepaidMinor: number
  feeRepaidMinor: number
  principalRepaidMinor: number
  outstandingMinor: number
  recoveryRateBps: number
  maximumRepaymentDays: number
  aprBps: number
  status: string | null
  disbursedAt: string | null
  dueAt: string | null
  settledAt: string | null
  createdAt: string | null
}

export type LendingBusiness = {
  businessId: number
  publicId: string
  name: string
  status: string | null
  summary: LendingSummary
}

export type LendingOverview = {
  summary: LendingSummary
  businesses: LendingBusiness[]
}

export type BusinessLending = {
  summary: LendingSummary
  loans: Loan[]
}

export type NotificationItem = {
  id: number
  title: string
  description: string
  category: 'kyc' | 'business' | 'user' | 'system'
  time: string
  read: boolean
}
