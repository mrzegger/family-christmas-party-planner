export type TaskCategory = string;

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export type AgeGroup = 'Adult' | 'Kid' | 'Senior';
export type RsvpStatus = 'Going' | 'Maybe' | 'Not Going' | 'Pending';

export type ContributionStatus = 'Pledged' | 'Partial' | 'Collected';

export type ExpenseCategory =
  | 'Food & Drinks'
  | 'Games & Prizes'
  | 'Decor & Venue'
  | 'Logistics & Tech'
  | 'Misc';

export type PaidSource = 'Unpaid / Planned' | 'Pooled Fund' | 'Cousin Out-of-Pocket';
export type ReimbursementStatus = 'N/A' | 'Needs Reimbursement' | 'Reimbursed';

export type MenuCourse =
  | 'Main Dish / Lechon'
  | 'Pasta & Noodles'
  | 'Sides & Salads'
  | 'Desserts & Kakanin'
  | 'Drinks & Bar'
  | 'Tableware & Ice';

export type MenuFulfillment = 'Catered / Ordered' | 'Home-Cooked' | 'Store-Bought';
export type MenuStatus = 'Planned' | 'Ordered' | 'Confirmed' | 'Ready';

export type ProgramCategory = string;

export type GameAudience = 'Everyone' | 'Adults' | 'Kids' | 'Parents / Titos & Titas';
export type GameStatus = 'Idea / Planning' | 'Props & Prizes Bought' | 'Ready to Host';

export type ChecklistCategory = string;

export type GuestHighlightIcon =
  | 'utensils'
  | 'party'
  | 'heart'
  | 'gift'
  | 'music'
  | 'camera'
  | 'sparkles';

export interface GuestHighlightItem {
  id: string;
  icon: GuestHighlightIcon;
  title: string;
  description: string;
  enabled: boolean;
}

export type GuestPortalCardId = 'rsvp' | 'highlights' | 'committee';

export interface GuestPortalCardConfig {
  id: GuestPortalCardId;
  label: string;
  enabled: boolean;
}

export interface EventConfig {
  title: string;
  subtitle: string;
  eventDate: string; // ISO string
  venueName: string;
  venueAddress: string;
  mapUrl: string;
  dressCode: string;
  dressColors: { name: string; hex: string }[];
  announcement: string;
  rsvpDeadline: string;
  currencySymbol: string;
  currencyCode: string;
  hqPin: string;
  targetBudget: number;
  // Guest Portal customizable cards & content
  highlightsCardTitle?: string;
  highlightsCardSubtitle?: string;
  highlightItems?: GuestHighlightItem[];
  committeeCardTitle?: string;
  guestPortalCards?: GuestPortalCardConfig[];
  // Custom categories saved by organizers
  customTaskCategories?: string[];
  customChecklistCategories?: string[];
  customProgramCategories?: string[];
}

export interface Cousin {
  id: string;
  name: string;
  role: string;
  committee?: string;
  avatarColor: string;
  isTreasurer?: boolean;
}

export interface FamilyUnit {
  id: string;
  name: string;
  branchLabel: string;
  subFamilies?: string[];
  notes?: string;
}

export interface Guest {
  id: string;
  familyUnitId: string;
  name: string;
  ageGroup: AgeGroup;
  rsvpStatus: RsvpStatus;
  dietaryNotes: string;
  subFamilyName?: string;
  isPlusOne?: boolean;
  plusOneOfGuestId?: string;
  updatedAt?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  committee: string; // Category name
  assigneeId?: string; // Legacy single assignee fallback
  assigneeIds?: string[]; // Multiple organizer IDs (empty = unassigned)
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  notes: string;
}

export interface FundContribution {
  id: string;
  contributorName: string;
  familyUnitId?: string;
  pledgedAmount: number;
  paidAmount: number;
  status: ContributionStatus;
  paymentMethod: string;
  heldByCousinId: string;
  notes: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: ExpenseCategory;
  estimatedCost: number;
  actualCost: number | null; // null or 0 when not yet paid/finalized
  paidSource: PaidSource;
  paidByCousinId: string; // '' when Unassigned
  reimbursementStatus: ReimbursementStatus;
  vendor: string;
  notes: string;
}

export interface CatererPackage {
  id: string;
  catererName: string;
  packageName: string;
  dishesIncluded: string;
  paxCount: number;
  totalCost: number;
  perHeadCost?: number;
  status: MenuStatus;
  contactInfo: string;
  responsibleCousinId: string;
  notes: string;
}

export interface MenuItem {
  id: string;
  name: string;
  course: MenuCourse;
  fulfillment: MenuFulfillment;
  vendorOrAssignee: string;
  responsibleCousinId: string;
  servings: number;
  estimatedCost: number;
  status: MenuStatus;
  dietaryInfo: string;
  notes: string;
}

export interface ProgramItem {
  id: string;
  startTime: string; // e.g. "18:00"
  durationMins: number;
  title: string;
  category: string;
  mcCousinId?: string;
  linkedGameId?: string;
  notes: string;
}

export interface GameItem {
  id: string;
  title: string;
  audience: GameAudience;
  mcCousinId?: string;
  durationMins: number;
  rules: string;
  materials: string;
  prizes: string;
  prizeBudget: number;
  status: GameStatus;
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  assignedCousinId: string; // Organizer ID or ''
  customAssigneeName?: string; // Name of person outside the committee if assigned externally
  quantity: string;
  isBought: boolean;
  isPacked: boolean;
  notes: string;
}

export interface PollOption {
  id: string;
  label: string;
  details?: string;
  costEstimate?: number;
  voterIds: string[]; // Array of Cousin IDs who voted for this option
}

export interface PollItem {
  id: string;
  title: string;
  category: string; // e.g., 'Catering', 'Games', 'Food', 'Theme', 'Venue', or Custom
  status: 'Open' | 'Finalized';
  allowMultipleVotes: boolean;
  options: PollOption[];
  winnerOptionId?: string;
  notes?: string;
  createdByCousinId?: string;
}

export interface PlannerState {
  eventConfig: EventConfig;
  cousins: Cousin[];
  familyUnits: FamilyUnit[];
  guests: Guest[];
  tasks: TaskItem[];
  contributions: FundContribution[];
  expenses: ExpenseItem[];
  catererPackages?: CatererPackage[];
  menuItems: MenuItem[];
  programItems: ProgramItem[];
  games: GameItem[];
  checklistItems: ChecklistItem[];
  polls?: PollItem[];
  lastUpdated: string;
}
