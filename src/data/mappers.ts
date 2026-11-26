import type {
  AdminBusinessDetailResource,
  AdminUserResource,
  BusinessLendingResource,
  BusinessResource,
  IdentificationType,
  LendingOverviewResource,
  LendingSummaryResource,
  LoanLendingResource,
} from '../lib/api'
import type {
  AdminUser,
  Business,
  BusinessLending,
  BusinessStatus,
  KycStatus,
  LendingBusiness,
  LendingOverview,
  LendingSummary,
  Loan,
} from './types'

function asStatus<T extends string>(value: string, fallback: T, allowed: readonly T[]): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

export function mapBusiness(resource: BusinessResource): Business {
  return {
    id: resource.id,
    publicId: resource.public_id,
    name: resource.business_name,
    businessTypeId: resource.business_type_id,
    businessType: resource.business_type?.name ?? 'Uncategorised',
    businessCategory: resource.business_category,
    registrationNumber: resource.registration_number,
    phone: resource.phone_number,
    email: resource.email,
    hasPhysicalLocation: resource.has_physical_location,
    countyId: resource.county_id,
    subCountyId: resource.sub_county_id,
    wardId: resource.ward_id,
    county: resource.county,
    town: resource.town,
    ward: resource.ward,
    physicalAddress: resource.physical_address,
    operatingSince: resource.operating_since,
    status: asStatus<BusinessStatus>(resource.status, 'pending', [
      'pending',
      'active',
      'suspended',
      'closed',
    ]),
    kycStatus: asStatus<KycStatus>(resource.kyc_status, 'unverified', [
      'unverified',
      'pending',
      'verified',
      'rejected',
    ]),
    collectionAccount: resource.collection_account_number,
    paybillNumber: null,
    walletBalanceMinor: resource.wallet_balance_minor,
    createdAt: resource.created_at,
    updatedAt: resource.updated_at,
    owners: [],
    paymentAccounts: [],
  }
}

export function mapBusinessDetail(resource: AdminBusinessDetailResource): Business {
  return {
    ...mapBusiness(resource),
    paybillNumber: resource.paybill_number,
    owners: resource.business_users.map((owner) => ({
      id: owner.id,
      userId: owner.user_id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone_number,
      role: owner.role,
      isPrimary: owner.is_primary_contact,
      status: owner.status,
    })),
    paymentAccounts: resource.payment_accounts.map((account) => ({
      id: account.id,
      provider: account.provider,
      channelType: account.channel_type,
      accountReference: account.account_reference,
      accountName: account.account_name,
      status: account.status,
      verifiedAt: account.verified_at,
    })),
  }
}

export function mapUser(resource: AdminUserResource): AdminUser {
  return {
    id: resource.id,
    name: resource.name,
    email: resource.email,
    emailVerifiedAt: resource.email_verified_at,
    phone: resource.phone_number,
    phoneVerifiedAt: resource.phone_verified_at,
    idType: resource.id_type,
    identificationNumber: resource.identification_number,
    dateOfBirth: resource.date_of_birth,
    isAdmin: resource.is_admin,
    adminActivatedAt: resource.admin_activated_at,
    role: resource.is_admin ? 'Admin' : 'Customer',
    businessesCount: resource.businesses_count ?? 0,
    createdAt: resource.created_at,
    updatedAt: resource.updated_at,
  }
}

export function mapLendingSummary(resource: LendingSummaryResource): LendingSummary {
  return {
    loansCount: resource.loans_count,
    disbursedLoansCount: resource.disbursed_loans_count,
    activeLoansCount: resource.active_loans_count,
    overdueLoansCount: resource.overdue_loans_count,
    settledLoansCount: resource.settled_loans_count,
    defaultedLoansCount: resource.defaulted_loans_count,
    principalMinor: resource.principal_minor,
    disbursedPrincipalMinor: resource.disbursed_principal_minor,
    feesMinor: resource.fees_minor,
    totalRepayableMinor: resource.total_repayable_minor,
    repaidMinor: resource.repaid_minor,
    feeRepaidMinor: resource.fee_repaid_minor,
    principalRepaidMinor: resource.principal_repaid_minor,
    outstandingMinor: resource.outstanding_minor,
    averageAprBps: resource.average_apr_bps,
    weightedAprBps: resource.weighted_apr_bps,
  }
}

export function mapLoan(resource: LoanLendingResource): Loan {
  return {
    id: resource.id,
    publicId: resource.public_id,
    businessId: resource.business_id,
    principalMinor: resource.principal_amount_minor,
    feeMinor: resource.fee_amount_minor,
    totalRepayableMinor: resource.total_repayable_minor,
    amountRepaidMinor: resource.amount_repaid_minor,
    feeRepaidMinor: resource.fee_repaid_minor,
    principalRepaidMinor: resource.principal_repaid_minor,
    outstandingMinor: resource.outstanding_balance_minor,
    recoveryRateBps: resource.recovery_rate_bps,
    maximumRepaymentDays: resource.maximum_repayment_days,
    aprBps: resource.apr_bps,
    status: resource.status,
    disbursedAt: resource.disbursed_at,
    dueAt: resource.due_at,
    settledAt: resource.settled_at,
    createdAt: resource.created_at,
  }
}

export function mapLendingBusiness(
  resource: LendingOverviewResource['businesses'][number],
): LendingBusiness {
  return {
    businessId: resource.business_id,
    publicId: resource.public_id,
    name: resource.business_name,
    status: resource.status,
    summary: mapLendingSummary(resource.summary),
  }
}

export function mapLendingOverview(resource: LendingOverviewResource): LendingOverview {
  return {
    summary: mapLendingSummary(resource.summary),
    businesses: resource.businesses.map(mapLendingBusiness),
  }
}

export function mapBusinessLending(resource: BusinessLendingResource): BusinessLending {
  return {
    summary: mapLendingSummary(resource.summary),
    loans: resource.advances.map(mapLoan),
  }
}

export function toIdentificationType(value: string): IdentificationType | null {
  const normalized = value.toLowerCase()
  if (normalized.includes('passport')) return 'passport'
  if (normalized.includes('national') || normalized.includes('id')) return 'kenyan_national_id'
  return null
}

export function toIsoDate(value: string): string | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function fromIsoDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}
