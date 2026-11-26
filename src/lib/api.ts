export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'https://qcash-api.southafricanorth.cloudapp.azure.com/api'

const TOKEN_KEY = 'qcash-admin-token'
const REMEMBER_KEY = 'qcash-admin-remember'

export type ApiError = Error & {
  status: number
  details?: Record<string, string[]>
}

export type PaginationLink = {
  url: string | null
  label: string
  active: boolean
}

export type PaginationMeta = {
  current_page: number
  from: number | null
  last_page: number
  links: PaginationLink[]
  path: string | null
  per_page: number
  to: number | null
  total: number
}

export type Paginated<T> = {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: PaginationMeta
}

export type BusinessTypeResource = {
  id: number
  name: string
  slug: string
  category: string
  description: string | null
  average_monthly_revenue_minor: number | null
  is_active: boolean
}

export type CountyResource = {
  id: number
  code: string
  name: string
  slug: string
  capital: string | null
  region: string | null
  iso_code: string | null
  postal_code: string | null
}

export type SubCountyResource = {
  id: number
  county_id: number
  code: string
  name: string
  slug: string
}

export type WardResource = {
  id: number
  sub_county_id: number
  code: string
  name: string
  slug: string
}

export type BusinessResource = {
  id: number
  public_id: string
  business_name: string
  business_type_id: number | null
  business_type: BusinessTypeResource | null
  business_category: string | null
  registration_number: string | null
  phone_number: string | null
  email: string | null
  has_physical_location: boolean
  county_id: number | null
  sub_county_id: number | null
  ward_id: number | null
  county: string | null
  town: string | null
  ward: string | null
  physical_address: string | null
  operating_since: string | null
  status: string
  kyc_status: string
  collection_account_number: string | null
  wallet_balance_minor: number
  created_at: string | null
  updated_at: string | null
}

export type BusinessUserResource = {
  id: number
  user_id: number
  name: string
  email: string | null
  phone_number: string | null
  role: string
  is_primary_contact: boolean
  status: 'active' | 'suspended'
}

export type PaymentAccountResource = {
  id: number
  business_id: number
  provider: string
  channel_type: string
  account_reference: string | null
  account_name: string | null
  status: string
  verified_at: string | null
  metadata: unknown[] | null
  created_at: string | null
  updated_at: string | null
}

export type AdminBusinessDetailResource = BusinessResource & {
  paybill_number: string
  business_users: BusinessUserResource[]
  payment_accounts: PaymentAccountResource[]
}

export type LendingSummaryResource = {
  loans_count: number
  disbursed_loans_count: number
  active_loans_count: number
  overdue_loans_count: number
  settled_loans_count: number
  defaulted_loans_count: number
  principal_minor: number
  disbursed_principal_minor: number
  fees_minor: number
  total_repayable_minor: number
  repaid_minor: number
  fee_repaid_minor: number
  principal_repaid_minor: number
  outstanding_minor: number
  average_apr_bps: number
  weighted_apr_bps: number
}

export type LoanLendingResource = {
  id: number
  public_id: string
  business_id: number
  principal_amount_minor: number
  fee_amount_minor: number
  total_repayable_minor: number
  amount_repaid_minor: number
  fee_repaid_minor: number
  principal_repaid_minor: number
  outstanding_balance_minor: number
  recovery_rate_bps: number
  maximum_repayment_days: number
  apr_bps: number
  status: string | null
  disbursed_at: string | null
  due_at: string | null
  settled_at: string | null
  created_at: string | null
}

export type LendingBusinessResource = {
  business_id: number
  public_id: string
  business_name: string
  status: string | null
  summary: LendingSummaryResource
}

export type LendingOverviewResource = {
  summary: LendingSummaryResource
  businesses: LendingBusinessResource[]
}

export type BusinessLendingResource = {
  summary: LendingSummaryResource
  advances: LoanLendingResource[]
}

export type AdminUserResource = {
  id: number
  name: string
  email: string | null
  email_verified_at: string | null
  phone_number: string | null
  phone_verified_at: string | null
  id_type: string | null
  identification_number: string | null
  date_of_birth: string | null
  is_admin: boolean
  admin_activated_at: string | null
  businesses_count?: number
  created_at: string | null
  updated_at: string | null
}

export type AdminLoginRequest = {
  phone_number: string
  password: string
}

export type AdminLoginResponse = {
  message: string
  token: string
  token_type: 'Bearer'
  user: AdminUserResource
}

export type ActivateAdminRequest = {
  phone_number: string
  otp: string
  password: string
  password_confirmation: string
}

export type ResendAdminActivationOtpRequest = {
  phone_number: string
}

export type UpdateBusinessRequest = {
  business_name: string
  business_type_id: number
  has_physical_location: boolean
  county_id: number | null
  sub_county_id: number | null
  ward_id: number | null
  physical_address: string | null
  phone_number: string | null
  email: string | null
  registration_number: string | null
}

export type BusinessStatus = 'pending' | 'active' | 'suspended' | 'closed'
export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

export type UpdateBusinessStatusRequest = {
  status: BusinessStatus
}

export type UpdateBusinessKycStatusRequest = {
  kyc_status: KycStatus
}

export type IdentificationType = 'kenyan_national_id' | 'passport'

export type UpdateUserRequest = {
  name: string
  email: string | null
  phone_number: string | null
  id_type: IdentificationType | null
  identification_number: string | null
  date_of_birth: string | null
}

export type MessageResponse = {
  message: string
}

export type DataResponse<T> = {
  data: T
  message?: string
}

export type DataListResponse<T> = {
  data: T[]
}

function readStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY)
}

export function getToken() {
  return readStoredToken()
}

export function setToken(token: string, remember: boolean) {
  clearToken()
  if (remember) {
    window.localStorage.setItem(TOKEN_KEY, token)
    window.localStorage.setItem(REMEMBER_KEY, '1')
  } else {
    window.sessionStorage.setItem(TOKEN_KEY, token)
    window.localStorage.removeItem(REMEMBER_KEY)
  }
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(REMEMBER_KEY)
  window.sessionStorage.removeItem(TOKEN_KEY)
}

export function isRememberingDevice() {
  return window.localStorage.getItem(REMEMBER_KEY) === '1'
}

function toApiError(payload: unknown, status: number): ApiError {
  let message = `Request failed with status ${status}`
  let details: Record<string, string[]> | undefined

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (typeof record.message === 'string') message = record.message
    if (record.errors && typeof record.errors === 'object') {
      details = {}
      for (const [field, value] of Object.entries(record.errors)) {
        details[field] = Array.isArray(value) ? value.map(String) : [String(value)]
      }
      const firstError = Object.values(details)[0]?.[0]
      if (firstError) message = `${message}: ${firstError}`
    }
  }

  return Object.assign(new Error(message), { status, details })
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const token = options.auth === false ? null : readStoredToken()
  const headers = new Headers()
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) throw toApiError(payload, response.status)
  return payload as T
}

export const api = {
  login: (body: AdminLoginRequest) =>
    request<AdminLoginResponse>('/admin/login', { method: 'POST', body, auth: false }),

  activate: (body: ActivateAdminRequest) =>
    request<MessageResponse>('/admin/activate', { method: 'POST', body, auth: false }),

  resendActivationOtp: (body: ResendAdminActivationOtpRequest) =>
    request<MessageResponse>('/admin/activate/resend-otp', { method: 'POST', body, auth: false }),

  me: () => request<DataResponse<AdminUserResource>>('/admin/me'),

  logout: () => request<MessageResponse>('/admin/logout', { method: 'POST' }),

  listBusinesses: () => request<Paginated<BusinessResource>>('/admin/businesses'),

  getBusiness: (id: number) =>
    request<DataResponse<AdminBusinessDetailResource>>(`/admin/businesses/${id}`),

  getLending: () => request<LendingOverviewResource>('/admin/lending'),

  getBusinessLending: (id: number) =>
    request<BusinessLendingResource>(`/admin/businesses/${id}/lending`),

  updateBusiness: (id: number, body: UpdateBusinessRequest) =>
    request<DataResponse<AdminBusinessDetailResource>>(`/admin/businesses/${id}`, {
      method: 'PATCH',
      body,
    }),

  updateBusinessStatus: (id: number, body: UpdateBusinessStatusRequest) =>
    request<DataResponse<AdminBusinessDetailResource>>(`/admin/businesses/${id}/status`, {
      method: 'PATCH',
      body,
    }),

  updateBusinessKycStatus: (id: number, body: UpdateBusinessKycStatusRequest) =>
    request<DataResponse<AdminBusinessDetailResource>>(`/admin/businesses/${id}/kyc-status`, {
      method: 'PATCH',
      body,
    }),

  listUsers: () => request<Paginated<AdminUserResource>>('/admin/users'),

  updateUser: (id: number, body: UpdateUserRequest) =>
    request<DataResponse<AdminUserResource>>(`/admin/users/${id}`, { method: 'PATCH', body }),

  grantAdmin: (id: number) =>
    request<DataResponse<AdminUserResource>>(`/admin/users/${id}/grant-admin`, { method: 'POST' }),

  revokeAdmin: (id: number) =>
    request<DataResponse<AdminUserResource>>(`/admin/users/${id}/revoke-admin`, { method: 'POST' }),

  listBusinessTypes: () => request<DataListResponse<BusinessTypeResource>>('/business-types'),

  listCounties: () => request<DataListResponse<CountyResource>>('/locations/counties'),

  listSubCounties: (countyId: number) =>
    request<DataListResponse<SubCountyResource>>(`/locations/counties/${countyId}/sub-counties`),

  listWards: (subCountyId: number) =>
    request<DataListResponse<WardResource>>(`/locations/sub-counties/${subCountyId}/wards`),
}
