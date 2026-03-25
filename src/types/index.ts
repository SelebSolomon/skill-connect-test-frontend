// ─── Auth ───────────────────────────────────────────────────────────────────

export type RoleName = 'guest' | 'client' | 'provider' | 'admin';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: RoleName;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleName: 'client' | 'provider';
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface Service {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  isActive: boolean;
}

// ─── Job ─────────────────────────────────────────────────────────────────────

export type JobStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Job {
  _id: string;
  clientId: string | User;
  providerId?: string | User | null;
  serviceId: string | Service;
  title: string;
  description: string;
  imageUrl?: string;
  budget: number;
  agreedPrice?: number | null;
  jobLocation: string;
  status: JobStatus;
  milestones: Milestone[];
  createdAt: string;
  assignedDate?: string;
  unassignReason?: string;
  unassignedAt?: string;
}

export interface Milestone {
  _id?: string;
  title: string;
  description?: string;
  amount?: number;
  status: 'pending' | 'completed' | 'paid';
}

export interface JobQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: JobStatus;
  serviceId?: string;
  minBudget?: number;
  maxBudget?: number;
  sort?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Bid ─────────────────────────────────────────────────────────────────────

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Bid {
  _id: string;
  jobId: string | Job;
  providerId: string | User;
  proposedPrice: number;
  message?: string;
  estimatedDuration: number;
  status: BidStatus;
  createdAt: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Location {
  city?: string;
  state?: string;
  country?: string;
}

export interface PortfolioItem {
  _id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
}

export interface Profile {
  _id: string;
  userId: string | User;
  title?: string;
  bio?: string;
  location?: Location;
  rate?: number;
  skills?: string[];
  services?: Service[];
  categories: string[];
  photoUrl?: string;
  portfolio?: PortfolioItem[];
  verified: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt?: string;
}

// ─── Conversation & Messages ──────────────────────────────────────────────────

export interface Attachment {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  fileName?: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
  duration?: number;
}

export type OfferStatus = 'pending' | 'accepted' | 'declined';

export interface MessageOffer {
  price: number;
  description: string;
  deliveryDays: number;
  serviceId: string;
  status: OfferStatus;
  jobId?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | User;
  type?: 'text' | 'offer';
  content: string;
  offer?: MessageOffer;
  attachments: Attachment[];
  readBy: string[];
  createdAt: string;
}

export interface ConversationParticipant {
  userId: string | User;
  role: RoleName;
  lastReadAt?: string;
}

export interface ConversationLastMessage {
  messageId: string;
  text: string;
  sentAt: string;
}

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  jobId?: string | Job;
  lastMessage?: ConversationLastMessage;
  /** Only the caller's unread count – already transformed by the backend */
  unread: number;
  createdAt: string;
}

export interface ChatRoom {
  conversation: Conversation;
  messages: Message[];
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType = 'message' | 'job' | 'bid' | 'review' | 'system';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  _id: string;
  jobId: string | Job;
  reviewerId: string | { _id: string; name: string; profile?: { photoUrl?: string } };
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ReviewsResult {
  user: { _id: string; name: string; email: string };
  numberOfReviews: number;
  averageRating: number;
  reviews: Review[];
  page: number;
  totalPages: number;
}

export interface CreateReviewDto {
  jobId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export type TransactionStatus = 'pending' | 'paid' | 'waived';

export interface Transaction {
  _id: string;
  jobId: string | { _id: string; title: string; status: string };
  providerId: string | { _id: string; name: string; email: string };
  clientId: string | { _id: string; name: string; email: string };
  agreedPrice: number;
  commissionRate: number;
  commissionAmount: number;
  status: TransactionStatus;
  paidAt: string | null;
  paidBy: string | null;
  paymentReference: string | null;
  pendingReference: string | null;
  waivedAt: string | null;
  waivedReason: string | null;
  createdAt: string;
}

export interface TransactionBalance {
  pending: number;
  paid: number;
  waived: number;
}

export interface MyTransactionsResult {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
  balance: TransactionBalance;
}

export interface PlatformSummary {
  totalGMV: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  waivedCommission: number;
  jobCount: number;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export type ReportTargetType = 'user' | 'job';
export type ReportReason = 'spam' | 'fraud' | 'harassment' | 'inappropriate' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';

export interface Report {
  _id: string;
  reporterId: string | { _id: string; name: string; email: string };
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ReportsListResult {
  reports: Report[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type WalletTransactionType = 'deposit' | 'deduction' | 'refund';
export type WalletTransactionStatus = 'pending' | 'approved' | 'rejected';

export interface WalletTransaction {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  type: WalletTransactionType;
  amount: number;
  status: WalletTransactionStatus;
  proofImageUrl: string | null;
  note: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface WalletInfo {
  balance: number;
  commissionOwed: number;
  totalDeposited: number;
  totalDeducted: number;
}

export interface WalletHistoryResult {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface ProviderStats {
  totalJobs: number;
  completedJobs: number;
  completionRate: number;
  activeJobs: number;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  totalEarnings: number;
}

export interface ClientStats {
  totalJobsPosted: number;
  activeJobs: number;
  completedJobs: number;
  totalSpent: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface UserSettings {
  _id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  shareLocation: boolean;
  locationRadius: number;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  activeProviders: number;
  totalRevenue: number;
  pendingReports: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roleName: string;
  emailVerified: boolean;
  banned: boolean;
  banReason?: string;
  isActive: boolean;
  walletBalance: number;
  isVerified: boolean;
  createdAt: string;
}

export interface AdminUsersResult {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
