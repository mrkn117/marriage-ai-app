// ============================================================
// User Types
// ============================================================
export interface UserProfile {
  uid: string;
  email: string;
  nickname: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  weight: number;
  annualIncome: number;
  occupation: string;
  residenceArea: string;
  marriageGoal: string;
  desiredPartner: string;
  weaknesses: string;
  concerns: string;
  dateArea: string;
  dateBudget: number;
  dateTimeSlot: 'lunch' | 'dinner' | 'half-day' | 'full-day';
  fashionStyle: string;
  fashionBudget: number;
  fashionPreference: 'high-brand' | 'cost-effective' | 'budget';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Diagnosis Types
// ============================================================
export interface DiagnosisScores {
  firstImpression: number;   // 20点
  cleanliness: number;       // 15点
  expression: number;        // 15点
  postureAndBody: number;    // 20点
  profileBalance: number;    // 15点
  marketValue: number;       // 15点
  total: number;             // 100点
}

export interface DiagnosisResult {
  id: string;
  userId: string;
  scores: DiagnosisScores;
  harshEvaluation: string;
  strengths: string;
  weaknesses: string;
  marketView: string;
  improvementPriority: string[];
  thisWeekAction: string;
  oneMonthAction: string;
  createdAt: Date;
  imageUrls: string[];
}

// ============================================================
// Fashion Types
// ============================================================
export interface FashionItem {
  name: string;
  brand: string;
  price: number;
  url: string;
  reason: string;
  category: string;
}

export interface FashionPlan {
  type: 'high-brand' | 'cost-effective' | 'budget';
  label: string;
  items: FashionItem[];
  totalPrice: number;
  impression: string;
  stylingTips: string;
}

export interface FashionSuggestion {
  id: string;
  userId: string;
  season: string;
  temperature: string;
  weather: string;
  dateType: string;
  plans: FashionPlan[];
  createdAt: Date;
}

// ============================================================
// Date Plan Types
// ============================================================
export interface DateScheduleItem {
  time: string;
  activity: string;
  venue: string;
  address: string;
  budget: number;
  tips: string;
}

export interface DatePlan {
  id: string;
  userId: string;
  planName: string;
  area: string;
  totalBudget: number;
  timeSlot: string;
  isFirstDate: boolean;
  partnerType: string;
  schedule: DateScheduleItem[];
  conversationFlow: string;
  ngActions: string[];
  invitePhrase: string;
  rainyDayAlternative: string;
  createdAt: Date;
}

// ============================================================
// Profile Generation Types
// ============================================================
export interface GeneratedProfile {
  id: string;
  userId: string;
  title: string;
  selfIntroduction: string;
  appealPoints: string[];
  hobbyDescription: string;
  partnerPreference: string;
  messageToSend: string;
  profilePhotoTips: string[];
  createdAt: Date;
}

// ============================================================
// Upload Types
// ============================================================
export interface UploadedImage {
  id: string;
  userId: string;
  url: string;
  storagePath: string;
  type: 'face' | 'full-body' | 'side' | 'back' | 'angle' | 'expression';
  uploadedAt: Date;
}

// ============================================================
// History Types
// ============================================================
export interface DiagnosisHistory {
  id: string;
  diagnosisId: string;
  totalScore: number;
  createdAt: Date;
  thumbnailUrl?: string;
}

// ============================================================
// API Request/Response Types
// ============================================================
export interface DiagnoseRequest {
  userProfile: UserProfile;
  imageUrls: string[];
  currentDate: string;
}

export interface FashionRequest {
  userProfile: UserProfile;
  currentDate: string;
  season: string;
  temperature: number;
  weather: string;
  dateType: string;
}

export interface DatePlanRequest {
  userProfile: UserProfile;
  area: string;
  budget: number;
  timeSlot: string;
  isFirstDate: boolean;
  partnerDescription: string;
}

// ============================================================
// Form Types
// ============================================================
export type OnboardingFormData = Omit<UserProfile, 'uid' | 'email' | 'createdAt' | 'updatedAt'>;

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  agreeToTerms: boolean;
}
