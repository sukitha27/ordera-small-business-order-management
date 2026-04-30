export type Lang = "en" | "si";

export const dict = {
  en: {
    appName: "Ordera",
    tagline: "Order management built for Sri Lankan businesses",
    heroDesc:
      "Track orders, manage products, handle COD & bank transfers, and dispatch with Pronto, Domex or Koombiyo — all from one clean dashboard.",
    getStarted: "Get started free",
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    email: "Email",
    password: "Password",
    businessName: "Business name",
    ownerName: "Owner name",
    phone: "Phone",
    address: "Address",
    city: "City",
    create: "Create account",
    welcome: "Welcome back",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    dashboard: "Dashboard",
    orders: "Orders",
    products: "Products",
    customers: "Customers",
    reports: "Reports",
    settings: "Settings",
    newOrder: "New order",
    newProduct: "New product",
    newCustomer: "New customer",
    revenue: "Revenue",
    totalOrders: "Total orders",
    pending: "Pending",
    delivered: "Delivered",
    todayRevenue: "Today's revenue",
    weekRevenue: "This week",
    monthRevenue: "This month",
    recentOrders: "Recent orders",
    topProducts: "Top products",
    orderNumber: "Order #",
    customer: "Customer",
    status: "Status",
    payment: "Payment",
    courier: "Courier",
    waybill: "Waybill",
    total: "Total",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    name: "Name",
    sku: "SKU",
    price: "Price",
    stock: "Stock",
    description: "Description",
    quantity: "Qty",
    unitPrice: "Unit price",
    subtotal: "Subtotal",
    shipping: "Shipping",
    notes: "Notes",
    addItem: "Add item",
    selectProduct: "Select product",
    cod: "Cash on Delivery",
    bankTransfer: "Bank transfer",
    cash: "Cash",
    unpaid: "Unpaid",
    paid: "Paid",
    refunded: "Refunded",
    confirmed: "Confirmed",
    packed: "Packed",
    shipped: "Shipped",
    cancelled: "Cancelled",
    language: "Language",
    profile: "Business profile",
    saved: "Saved",
    deleted: "Deleted",
    created: "Created",
    updated: "Updated",
    noOrders: "No orders yet",
    noProducts: "No products yet",
    noCustomers: "No customers yet",
    search: "Search",
    salesOverTime: "Sales over time",
    statusBreakdown: "Status breakdown",
    by: "by",
    units: "units",
    inStock: "in stock",
    lkr: "LKR",
    addFirstOrder: "Add your first order",
    landingFeat1Title: "All your orders, one place",
    landingFeat1Desc:
      "Pending → Confirmed → Packed → Shipped → Delivered. Always know what's next.",
    landingFeat2Title: "COD & bank transfer ready",
    landingFeat2Desc:
      "Mark payment status, track collections, log bank slips — built for Sri Lankan commerce.",
    landingFeat3Title: "Courier dispatch built-in",
    landingFeat3Desc:
      "Pronto, Domex, Koombiyo, Fardar — assign couriers and track waybills from each order.",
    landingFeat4Title: "Dashboard that talks money",
    landingFeat4Desc:
      "Revenue in LKR, top products, daily and monthly trends. Decisions, not spreadsheets.",
    features: "Features",
    pricing: "Free during beta",
    footerLine: "Made for Sri Lankan online businesses.",
    forgotPassword: "Forgot password?",
    resetPassword: "Reset password",
    resetPasswordDesc:
      "Enter your email and we'll send you a link to reset your password.",
    sendResetLink: "Send reset link",
    checkEmail: "Check your email",
    resetLinkSent: "We sent a password reset link to",
    sendAgain: "Send again",
    backToLogin: "Back to login",
    setNewPassword: "Set a new password",
    setNewPasswordDesc:
      "Choose a strong password you haven't used before.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    changePassword: "Change password",
    changePasswordDesc:
      "Enter your current password to set a new one.",
    currentPassword: "Current password",
    currentPasswordWrong: "Current password is incorrect",
    passwordChanged: "Password updated",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    linkExpired: "Link expired",
    linkExpiredDesc:
      "This password reset link is invalid or has expired. Please request a new one.",
    redirectingLogin: "Redirecting to login…",
    pending_verification: "Awaiting verification",
    bankTransferSlips: "Bank transfer slips",
    slipsHelpText:
      "Upload slips when customers send proof of bank transfer. Verify each one to mark the order as paid.",
    orderTotal: "Order total",
    verifiedAmount: "Verified",
    remaining: "Remaining",
    dropSlipHere: "Drop slip here or click to upload",
    slipFileHint: "JPG, PNG, WebP or PDF · max 2MB",
    invalidFileType:
      "Only images (JPG, PNG, WebP) and PDFs are accepted",
    fileTooLarge: "File too large (max 2MB after compression)",
    selectFile: "Please select a file",
    enterAmount: "Please enter the amount on the slip",
    amountOnSlip: "Amount on slip (LKR)",
    amountMismatchWarning:
      "Amount doesn't match the remaining balance of",
    uploadSlip: "Upload slip",
    uploading: "Uploading...",
    slipUploaded: "Slip uploaded",
    slipVerified: "Slip verified",
    slipRejected: "Slip rejected",
    slipDeleted: "Slip deleted",
    autoMarkedPaid: "Slip verified — order marked as paid",
    uploadedSlips: "Uploaded slips",
    pendingVerificationOf: "Pending verification:",
    rejectionReasonPrompt:
      "Why is this slip being rejected? (optional)",
    confirmDeleteSlip: "Delete this slip permanently?",
    verified: "Verified",
    preview: "Preview",
    verify: "Verify",
    reject: "Reject",
    close: "Close",
    loading: "Loading...",
    actionNeeded: "Action needed",
    slipsAwaitingVerification: "slips awaiting verification",
    inPendingSlips: "in pending bank transfer slips",
    backToCustomers: "Back to customers",
    customerNotFound: "Customer not found",
    editCustomer: "Edit customer",
    confirmDeleteCustomer:
      "Delete this customer? Their orders will remain but will no longer be linked.",
    customerNotes: "Notes",
    customerNotesPlaceholder:
      "Anything to remember about this customer? E.g. 'always asks for fragile wrapping', 'pays weekly'...",
    notesAutoSave:
      "Notes save automatically when you click outside.",
    lifetimeSpend: "Lifetime spend",
    avgOrderValue: "Average order",
    lastOrder: "Last order",
    today: "Today",
    daysAgoSuffix: "d ago",
    orderHistory: "Order history",
    noOrdersFromCustomer:
      "No orders from this customer yet.",
    loadMore: "Load more",
    date: "Date",
    vipCustomer: "VIP customer",
    returningCustomer: "Returning customer",
    exportOrders: "Export orders",
    exportOrdersDesc:
      "Download a CSV file you can open in Excel or share with your accountant.",
    ordersToExport: "Orders to export",
    currentView: "Current view",
    allOrders: "All orders",
    ignoreFilters: "Ignore filters",
    format: "Format",
    summary: "Summary",
    detailed: "Detailed",
    oneRowPerOrder: "One row per order",
    oneRowPerItem: "One row per item",
    dateRange: "Date range",
    allTime: "All time",
    todayLabel: "Today",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    thisMonth: "This month",
    custom: "Custom",
    from: "From",
    to: "To",
    downloadCsv: "Download CSV",
    exporting: "Exporting...",
    ordersExported: "orders exported",
    ordersUnit: "orders",
    noOrdersToExport: "No orders match those filters",
    branding: "Branding",
    brandingDesc:
      "Your logo will appear on invoices, waybills, and the dashboard sidebar.",
    currentLogo: "Current logo",
    logoAppearsOn:
      "Appears on invoices, waybills, and dashboard.",
    replace: "Replace",
    confirmRemoveLogo: "Remove your business logo?",
    dropLogoHere:
      "Drop your logo here or click to upload",
    logoFileHint: "PNG, JPG, WebP, or SVG · max 2MB",
    logoTip:
      "Tip: A logo with transparent background looks best.",
    logoUploaded: "Logo uploaded",
    logoRemoved: "Logo removed",
    completeCaptcha: "Please complete the security check",
    dangerZone: "Danger zone",
    dangerZoneDesc:
      "Irreversible account actions. Please be careful.",
    deleteAccount: "Delete account",
    deleteAccountDesc:
      "Schedule your account for permanent deletion in 30 days.",
    deleteAccountConfirmTitle:
      "Delete your Ordera account",
    deleteAccountConfirmDesc:
      "This schedules your account for permanent deletion in 30 days. You can cancel anytime by logging back in within that window.",
    whatGetsDeleted: "What gets deleted:",
    deletedItem1:
      "All your orders, customers, and products",
    deletedItem2: "Your business profile and logo",
    deletedItem3:
      "All payment slips and order history",
    deletedItem4: "Your login credentials",
    deletionGracePeriod:
      "You can recover everything if you log back in within 30 days.",
    typeToConfirm: "Type",
    enterPasswordToConfirm:
      "Enter your password to confirm",
    typeDeleteToConfirm:
      "Type DELETE in the confirmation box",
    passwordRequired: "Password is required",
    scheduleDeletion: "Schedule deletion",
    accountScheduledForDeletion:
      "Your account is scheduled for deletion",
    daysUntilDeletion:
      "{days} days remaining. Permanent deletion on {date}.",
    cancelDeletion: "Cancel deletion",
    deletionCancelled:
      "Deletion cancelled — your account is safe.",
    publicOrderForm: "Public order form",
    publicOrderFormDesc:
      "Share a public URL where customers can place orders directly. Submitted orders go to your inquiries inbox for review.",
    publicFormUrl: "Public URL",
    saveSlug: "Save URL",
    slugHint:
      "Lowercase letters, numbers, and hyphens only. 3–60 characters.",
    slugTaken:
      "This URL is already taken. Try another.",
    saveSlugFirst: "Save your URL first",
    enablePublicForm: "Enable public form",
    publicFormLive:
      "Customers can place orders right now",
    publicFormOff:
      "Form is disabled — URL returns 'not available'",
    publicFormEnabled: "Public form is now live",
    publicFormDisabled: "Public form disabled",
    yourPublicUrl: "Your shop URL",
    shareUrlHint:
      "Share this on WhatsApp, Facebook, Instagram, or your bio.",
    urlCopied: "URL copied to clipboard",
    copy: "Copy",
    copied: "Copied!",
    publicFormPreview: "Open",
    inquiries: "Inquiries",
    inquiriesDesc:
      "Orders submitted via your public form, awaiting review.",
    pendingReview: "Pending review",
    rejected: "Rejected",
    all: "All",
    selected: "selected",
    confirmAll: "Confirm all",
    rejectAll: "Reject all",
    clear: "Clear",
    confirmBulkReject:
      "Reject all selected inquiries as fake? They will be cancelled.",
    inquiriesConfirmedCount:
      "{count} inquiries confirmed",
    inquiriesRejectedCount:
      "{count} inquiries rejected",
    publicFormNotEnabled:
      "Your public order form is disabled",
    publicFormNotEnabledDesc:
      "Enable it in Settings to start accepting customer inquiries.",
    enableInSettings: "Enable in settings",
    searchInquiries: "Search inquiries...",
    noPendingInquiries:
      "No pending inquiries — you're all caught up!",
    noRejectedInquiries: "No rejected inquiries.",
    noInquiriesYet: "No inquiries yet.",
    shareUrlForOrders:
      "Share your public URL on WhatsApp / social media to start receiving orders.",
    when: "When",
    items: "Items",
    item: "item",
    itemPlural: "items",
    bankTransferLabel: "Bank Transfer",
    duplicate: "Duplicate",
    duplicatePhoneWarning:
      "Same phone number has another pending inquiry — possible fake order",
    clickInquiryToReview:
      "Click any inquiry to view full details and confirm/reject.",
    inquiryFromPublicForm:
      "New inquiry from your public order form",
    inquiryReviewDesc:
      "Review the details below. Confirm to convert this into a real order, or reject if it looks fake.",
    confirmInquiry: "Confirm order",
    rejectAsFake: "Reject as fake",
    confirmRejectInquiry:
      "Mark this inquiry as fake? It will be cancelled.",
    inquiryConfirmed:
      "Inquiry confirmed — order is now active",
    inquiryRejected:
      "Inquiry rejected and cancelled",

    // ============ LANDING PAGE KEYS — ENGLISH ============

    // ── Hero ──────────────────────────────────────────────
    // FIX: Removed "#1" — no data to support that claim
    heroEyebrow: "Built for Sri Lankan online businesses",

    heroHeadline:
      "Stop Losing Orders to WhatsApp Chats and Paper Books",

    // FIX: "Built for" → "Works with" — no API integration yet
    heroSubheadline:
      "Manage every order, COD payment, and courier dispatch — from pending to delivered — in one simple dashboard. Works with Pronto, Domex, Koombiyo, and Fardar.",

    watchDemo: "See how it works",

    // FIX: "No Card Needed" kept — accurate for free plan
    noCardNeeded: "No card needed",

    // FIX: Removed fake stats (LKR 50M+, 15,000+ packages)
    // These keys are kept for backwards compat but now show honest content
    trustedBy: "Works with all major SL couriers",
    lkrProcessed: "No hidden fees",
    packagesDispatched: "Cancel anytime",

    // ── Pain points ───────────────────────────────────────
    painHeadline:
      "Running an Online Store in Sri Lanka Shouldn't Feel Like Chaos",
    painSubheadline:
      "Sound familiar? These are the daily struggles we built Ordera to eliminate.",
    pain1Title: "Who paid? Who didn't?",
    pain1Desc:
      "COD payments scattered across WhatsApp, bank slips, and memory. Revenue leaks every week.",
    pain2Title: "Which courier? What waybill?",
    pain2Desc:
      "Switching between Pronto, Domex, Koombiyo portals, copy-pasting addresses, losing track.",
    pain3Title: "Where is that order?",
    pain3Desc:
      "Customers call 5 times a day. Your team spends hours updating statuses in Excel or Messenger.",

    // ── Features ──────────────────────────────────────────
    featuresHeadline:
      "One Place. Every Order. Zero Chaos.",
    featuresSubheadline:
      "A workflow that actually matches how your Sri Lankan business runs.",
    feature1Title: "All Your Orders, One Pipeline",
    feature1Desc:
      "Move each order from Pending → Confirmed → Packed → Shipped → Delivered. Your whole team sees the same status in real-time.",
    feature1Bullet1:
      "Color-coded status tags for instant clarity",
    feature1Bullet2:
      "Bulk update orders in one click",
    feature1Bullet3:
      "Customer notifications via WhatsApp (coming soon)",
    feature2Title:
      "COD & Bank Transfers, Finally Under Control",
    feature2Desc:
      "Mark payment as collected when the courier returns. Upload bank slips. See daily collection totals at a glance.",
    feature2Bullet1: "Daily COD collection report",
    feature2Bullet2:
      "Bank slip image upload & verification",
    feature2Bullet3:
      "Pending payment dashboard with alerts",
    feature3Title:
      "Dispatch Without Leaving Ordera",
    feature3Desc:
      "Assign Pronto, Domex, Koombiyo, or Fardar from a dropdown. Paste waybill once. Track delivery status.",
    feature3Bullet1:
      "All major Sri Lankan couriers supported",
    feature3Bullet2:
      "Waybill history & tracking links",
    feature3Bullet3:
      "Courier performance comparison",
    feature4Title: "Dashboard That Speaks Money",
    feature4Desc:
      "Revenue in LKR, top products, daily trends — no spreadsheets required. Make decisions based on real data, not guesswork.",
    feature4Bullet1:
      "LKR revenue dashboards with trends",
    feature4Bullet2: "Top-selling products report",
    feature4Bullet3:
      "Export everything to Excel when needed",

    // ── How it works ──────────────────────────────────────
    howItWorksHeadline:
      "From Sign-Up to Smooth Operations in Under 10 Minutes",
    step1Title: "Create your account",
    step1Desc:
      "Add your business name, currency (LKR default), and courier preferences. Takes 2 minutes.",
    step2Title: "Add your first order",
    step2Desc:
      "Customer name, items, value, payment method, courier. Or import from CSV in seconds.",
    step3Title: "Move, dispatch, track",
    step3Desc:
      "Your team updates statuses. You watch the dashboard. Chaos ends. Operations become 10x faster.",

    // ── Pricing ───────────────────────────────────────────
    pricingHeadline: "Plans That Grow With Your Store",
    pricingSubheadline:
      "All prices in LKR. No hidden fees. Cancel anytime.",
    starterPlan: "Starter",
    growthPlan: "Growth",
    businessPlan: "Business",
    ordersUpTo: "Up to {count} orders",
    mostPopular: "Most Popular",

    // FIX: "Start Free Trial" → "Get started free"
    // There is no trial — free plan is free forever up to 50 orders
    startTrial: "Get started free",
    contactSales: "Contact Sales",
    allPlansInclude:
      "All plans include: Sinhala & English UI · Mobile-responsive · Secure data hosting · Bank slip verification",

    // ── Testimonials (keys kept for backwards compat, section removed from UI) ──
    testimonialsHeadline: "See Why Store Owners Switched",
    testimonial1Quote: "",
    testimonial1Name: "",
    testimonial1Role: "",
    testimonial2Quote: "",
    testimonial2Name: "",
    testimonial2Role: "",
    testimonial3Quote: "",
    testimonial3Name: "",
    testimonial3Role: "",

    // ── FAQ ───────────────────────────────────────────────
    faqHeadline: "Common Questions (and Honest Answers)",
    faq1Q: "Is my data safe?",
    faq1A: "Yes. We use secure cloud hosting (Supabase on AWS) with encrypted storage. Your order and customer data is never shared or sold. Each merchant's data is completely isolated — no other business can see yours.",
    faq2Q: "Can I use this on my phone?",
    faq2A: "Absolutely. Ordera is fully mobile-responsive. Your team can update orders, check payments, and dispatch from any smartphone — no app install needed.",
    faq3Q: "What if I need to cancel?",
    faq3A: "No lock-in contracts. Cancel anytime from your account settings. Export all your data before you go — it's yours, not ours.",

    // FIX: Removed "Q4 2026" specific date promise
    faq4Q: "Do you integrate directly with Pronto/Domex APIs?",
    faq4A: "Currently, you paste waybills manually for maximum courier flexibility. Direct API integration with Sri Lankan couriers is on our roadmap — we'll notify you when it's ready.",

    // FIX: Removed multi-user access claim — feature not built yet
    faq5Q: "Can I give access to my staff?",
    faq5A: "Multi-user access with role-based permissions is on our roadmap for paid plans. For now, each account has a single login. Contact us if this is a priority for your business.",

    // ── Final CTA ─────────────────────────────────────────
    finalHeadline:
      "Ready to Ditch the Paper Books and WhatsApp Chaos?",

    // FIX: Removed "free 14-day trial" — no trial system
    // Free plan is 50 orders/month forever, not a time-limited trial
    finalSubheadline:
      "Start free — 50 orders per month, no card needed. Get a personal onboarding call in Sinhala or English.",

    bookDemo: "Book a demo on WhatsApp",

    // FIX: Removed "Join 200+ businesses" — fabricated number
    joinBusinesses:
      "Free during beta — no card needed",
  },

  si: {
    appName: "Ordera",
    tagline: "ශ්‍රී ලාංකික ව්‍යාපාර සඳහා නිර්මාණය කළ ඇණවුම් කළමනාකරණය",
    heroDesc:
      "ඇණවුම් නිරීක්ෂණය කරන්න, භාණ්ඩ කළමනාකරණය කරන්න, COD සහ බැංකු මාරු හසුරුවන්න, සහ Pronto, Domex හෝ Koombiyo සමඟ dispatch කරන්න — එක පැහැදිලි dashboard එකකින්.",
    getStarted: "නොමිලේ ආරම්භ කරන්න",
    signIn: "පුරන්න",
    signUp: "ලියාපදිංචි වන්න",
    signOut: "පිටවන්න",
    email: "ඊමේල්",
    password: "මුරපදය",
    businessName: "ව්‍යාපාරයේ නම",
    ownerName: "හිමිකරුගේ නම",
    phone: "දුරකථන",
    address: "ලිපිනය",
    city: "නගරය",
    create: "ගිණුම සාදන්න",
    welcome: "නැවත සාදරයෙන් පිළිගනිමු",
    noAccount: "ගිණුමක් නැද්ද?",
    haveAccount: "දැනටමත් ගිණුමක් තිබේද?",
    dashboard: "Dashboard",
    orders: "ඇණවුම්",
    products: "භාණ්ඩ",
    customers: "පාරිභෝගිකයින්",
    reports: "වාර්තා",
    settings: "සැකසුම්",
    newOrder: "නව ඇණවුම",
    newProduct: "නව භාණ්ඩය",
    newCustomer: "නව පාරිභෝගික",
    revenue: "ආදායම",
    totalOrders: "මුළු ඇණවුම්",
    pending: "පොරොත්තුවෙන්",
    delivered: "භාරදුන්",
    todayRevenue: "අද ආදායම",
    weekRevenue: "මේ සතිය",
    monthRevenue: "මේ මාසය",
    recentOrders: "මෑත ඇණවුම්",
    topProducts: "ප්‍රමුඛ භාණ්ඩ",
    orderNumber: "ඇණවුම #",
    customer: "පාරිභෝගික",
    status: "තත්ත්වය",
    payment: "ගෙවීම",
    courier: "කුරියර්",
    waybill: "Waybill",
    total: "මුළු",
    actions: "ක්‍රියා",
    edit: "සංස්කරණය",
    delete: "මකන්න",
    save: "සුරකින්න",
    cancel: "අවලංගු",
    confirm: "තහවුරු",
    name: "නම",
    sku: "SKU",
    price: "මිල",
    stock: "තොගය",
    description: "විස්තරය",
    quantity: "ගණන",
    unitPrice: "ඒකක මිල",
    subtotal: "උප එකතුව",
    shipping: "ප්‍රවාහන",
    notes: "සටහන්",
    addItem: "අයිතමයක් එකතු",
    selectProduct: "භාණ්ඩය තෝරන්න",
    cod: "භාරදීමේදී මුදල්",
    bankTransfer: "බැංකු මාරුව",
    bankTransferLabel: "බැංකු මාරුව",
    cash: "මුදල්",
    unpaid: "ගෙවා නැත",
    paid: "ගෙවා ඇත",
    refunded: "ආපසු",
    confirmed: "තහවුරු",
    packed: "ඇසුරුම්",
    shipped: "යවා ඇත",
    cancelled: "අවලංගු",
    language: "භාෂාව",
    profile: "ව්‍යාපාර පැතිකඩ",
    saved: "සුරකින ලදී",
    deleted: "මකා ඇත",
    created: "සෑදුවා",
    updated: "යාවත්කාලීන",
    noOrders: "තවම ඇණවුම් නැත",
    noProducts: "තවම භාණ්ඩ නැත",
    noCustomers: "තවම පාරිභෝගිකයින් නැත",
    search: "සොයන්න",
    salesOverTime: "කාලය අනුව විකුණුම්",
    statusBreakdown: "තත්ත්ව බෙදීම",
    by: "විසින්",
    units: "ඒකක",
    inStock: "තොගයේ",
    lkr: "රු.",
    addFirstOrder: "ඔබේ පළමු ඇණවුම එකතු කරන්න",
    landingFeat1Title: "සියලුම ඇණවුම්, එක තැනක",
    landingFeat1Desc:
      "පොරොත්තුවෙන් → තහවුරු → ඇසුරුම් → යැවූ → භාරදුන්.",
    landingFeat2Title: "COD සහ බැංකු මාරු",
    landingFeat2Desc:
      "ගෙවීම් තත්ත්වය සලකුණු කරන්න, එකතු කිරීම් නිරීක්ෂණය කරන්න.",
    landingFeat3Title: "කුරියර් භාරදීම තුළ",
    landingFeat3Desc:
      "Pronto, Domex, Koombiyo, Fardar — සෑම ඇණවුමක් සඳහාම.",
    landingFeat4Title: "මුදල් කතා කරන Dashboard",
    landingFeat4Desc:
      "රු. වලින් ආදායම, ප්‍රමුඛ භාණ්ඩ, දිනපතා සහ මාසික ප්‍රවණතා.",
    features: "විශේෂාංග",
    pricing: "Beta කාලය තුළ නොමිලේ",
    footerLine:
      "ශ්‍රී ලාංකික සබැඳි ව්‍යාපාර සඳහා සාදන ලදී.",
    forgotPassword: "මුරපදය අමතකද?",
    resetPassword: "මුරපදය යළි සකසන්න",
    resetPasswordDesc:
      "ඔබේ ඊමේල් ලිපිනය ඇතුළත් කරන්න, අපි මුරපදය යළි සකසන සබැඳියක් එවන්නෙමු.",
    sendResetLink: "සබැඳිය එවන්න",
    checkEmail: "ඔබේ ඊමේල් පරීක්ෂා කරන්න",
    resetLinkSent:
      "මුරපදය යළි සකසන සබැඳිය එවන ලදී",
    sendAgain: "නැවත එවන්න",
    backToLogin: "පිවිසුමට ආපසු",
    setNewPassword: "නව මුරපදයක් සකසන්න",
    setNewPasswordDesc:
      "ඔබ මෙතෙක් භාවිතා නොකළ ශක්තිමත් මුරපදයක් තෝරන්න.",
    newPassword: "නව මුරපදය",
    confirmPassword: "මුරපදය තහවුරු කරන්න",
    changePassword: "මුරපදය වෙනස් කරන්න",
    changePasswordDesc:
      "නව මුරපදයක් සැකසීමට වර්තමාන මුරපදය ඇතුළත් කරන්න.",
    currentPassword: "වර්තමාන මුරපදය",
    currentPasswordWrong:
      "වර්තමාන මුරපදය වැරදියි",
    passwordChanged:
      "මුරපදය යාවත්කාලීන කරන ලදී",
    passwordMismatch: "මුරපද නොගැළපේ",
    passwordTooShort:
      "මුරපදය අවම අකුරු 6ක් විය යුතුය",
    linkExpired: "සබැඳිය කල් ඉකුත්ව ඇත",
    linkExpiredDesc:
      "මෙම සබැඳිය අවලංගුයි හෝ කල් ඉකුත්ව ඇත. කරුණාකර නව එකක් ඉල්ලන්න.",
    redirectingLogin:
      "පිවිසුමට යොමු කරමින්…",
    pending_verification: "සත්‍යාපනය අපේක්ෂිතයි",
    bankTransferSlips: "බැංකු මාරු slips",
    slipsHelpText:
      "පාරිභෝගිකයන් බැංකු මාරු සාක්ෂි එවූ විට slip එක upload කරන්න. ගෙවීම තහවුරු කිරීමට verify කරන්න.",
    orderTotal: "මුළු එකතුව",
    verifiedAmount: "තහවුරු කර ඇති",
    remaining: "ඉතිරි",
    dropSlipHere:
      "Slip එක මෙතනට drop කරන්න හෝ ක්ලික් කරන්න",
    slipFileHint: "JPG, PNG, WebP හෝ PDF · උපරිම 2MB",
    invalidFileType:
      "පින්තූර (JPG, PNG, WebP) සහ PDF පමණක් පිළිගැනේ",
    fileTooLarge:
      "File එක විශාලයි (උපරිම 2MB)",
    selectFile: "කරුණාකර file එකක් තෝරන්න",
    enterAmount:
      "කරුණාකර slip එකේ ඇති මුදල ඇතුළු කරන්න",
    amountOnSlip: "Slip එකේ මුදල (රු.)",
    amountMismatchWarning:
      "මුදල ඉතිරි balance එකට සමාන නෑ:",
    uploadSlip: "Slip Upload කරන්න",
    uploading: "Upload වෙනවා...",
    slipUploaded: "Slip එක upload කළා",
    slipVerified: "Slip එක verify කළා",
    slipRejected: "Slip එක reject කළා",
    slipDeleted: "Slip එක මකා දැමුවා",
    autoMarkedPaid:
      "Slip එක verify වුණා — order එක paid ලෙස සලකුණු කළා",
    uploadedSlips: "Upload කළ Slips",
    pendingVerificationOf:
      "Verify කරන්න ඉතිරි:",
    rejectionReasonPrompt:
      "Slip එක reject කරන්නේ ඇයි? (අවශ්‍ය නෑ)",
    confirmDeleteSlip:
      "මේ slip එක ස්ථිරව මකන්නද?",
    verified: "තහවුරුයි",
    rejected: "ප්‍රතික්ෂේපිතයි",
    preview: "පෙරදර්ශනය",
    verify: "තහවුරු",
    reject: "ප්‍රතික්ෂේප",
    close: "වසන්න",
    loading: "පූරණය වෙනවා...",
    actionNeeded: "ක්‍රියාවලියක් අවශ්‍යයි",
    slipsAwaitingVerification:
      "slips සත්‍යාපනය කිරීමට ඇත",
    inPendingSlips:
      "පොරොත්තුවෙන් ඇති බැංකු මාරු slips",
    backToCustomers: "පාරිභෝගිකයන්ට ආපසු",
    customerNotFound:
      "පාරිභෝගිකයා හමු නොවීය",
    editCustomer:
      "පාරිභෝගිකයා සංස්කරණය කරන්න",
    confirmDeleteCustomer:
      "මෙම පාරිභෝගිකයා මකනවාද? ඔවුන්ගේ ඇණවුම් රැඳී ඇත නමුත් සම්බන්ධතාව ඉවත් වේ.",
    customerNotes: "සටහන්",
    customerNotesPlaceholder:
      "මෙම පාරිභෝගිකයා ගැන මතක තබා ගත යුතු දේ? උදා: 'සැමවිටම fragile wrapping ඉල්ලයි', 'සතිපතා ගෙවයි'...",
    notesAutoSave:
      "පිටතට ක්ලික් කළ විට සටහන් ස්වයංක්‍රීයව සුරකින්නේ ය.",
    lifetimeSpend: "මුළු වියදම",
    avgOrderValue: "සාමාන්‍ය ඇණවුම",
    lastOrder: "අවසන් ඇණවුම",
    today: "අද",
    daysAgoSuffix: "දිනයකට පෙර",
    orderHistory: "ඇණවුම් ඉතිහාසය",
    noOrdersFromCustomer:
      "මෙම පාරිභෝගිකයාගෙන් තවම ඇණවුම් නෑ.",
    loadMore: "තවත් පෙන්වන්න",
    date: "දිනය",
    vipCustomer: "VIP පාරිභෝගික",
    returningCustomer:
      "නැවත එන පාරිභෝගික",
    exportOrders: "ඇණවුම් export කරන්න",
    exportOrdersDesc:
      "Excel වලින් open කරන්න පුළුවන් CSV file එකක් download කරන්න.",
    ordersToExport: "Export කරන ඇණවුම්",
    currentView: "දැන් පෙනෙන",
    allOrders: "සියලු ඇණවුම්",
    ignoreFilters: "Filters නොසලකන්න",
    format: "ආකෘතිය",
    summary: "සාරාංශය",
    detailed: "විස්තරාත්මක",
    oneRowPerOrder: "ඇණවුමකට පේළියක්",
    oneRowPerItem: "අයිතමයකට පේළියක්",
    dateRange: "කාල සීමාව",
    allTime: "සියලු කාලය",
    todayLabel: "අද",
    last7Days: "පසුගිය දින 7",
    last30Days: "පසුගිය දින 30",
    thisMonth: "මේ මාසය",
    custom: "Custom",
    from: "ඉඳන්",
    to: "දක්වා",
    downloadCsv: "CSV Download කරන්න",
    exporting: "Export වෙනවා...",
    ordersExported: "ඇණවුම් export කළා",
    ordersUnit: "ඇණවුම්",
    noOrdersToExport:
      "මෙම filters වලට ගැලපෙන ඇණවුම් නෑ",
    branding: "ව්‍යාපාර සලකුණ",
    brandingDesc:
      "ඔබේ logo එක invoices, waybills, සහ dashboard sidebar එකේ පෙන්වයි.",
    currentLogo: "දැන් තියෙන logo එක",
    logoAppearsOn:
      "Invoices, waybills, සහ dashboard එකේ පෙනේ.",
    replace: "මාරු කරන්න",
    confirmRemoveLogo:
      "ඔබේ ව්‍යාපාර logo එක ඉවත් කරන්නද?",
    dropLogoHere:
      "Logo එක මෙතන drop කරන්න හෝ upload කරන්න click කරන්න",
    logoFileHint:
      "PNG, JPG, WebP, හෝ SVG · උපරිම 2MB",
    logoTip:
      "ඉඟිය: transparent background සහිත logo එක හොඳම විදිහට පෙනේ.",
    logoUploaded: "Logo upload කෙරුවා",
    logoRemoved: "Logo ඉවත් කෙරුවා",
    completeCaptcha:
      "ආරක්ෂණ පරීක්ෂාව සම්පූර්ණ කරන්න",
    dangerZone: "අවදානම් කලාපය",
    dangerZoneDesc:
      "නැවත හැරවිය නොහැකි ක්‍රියා. ප්‍රවේසමෙන්.",
    deleteAccount: "ගිණුම මකන්න",
    deleteAccountDesc:
      "ඔබේ ගිණුම දින 30කින් සදහටම මකන්න සැලසුම් කරන්න.",
    deleteAccountConfirmTitle:
      "ඔබේ Ordera ගිණුම මකන්න",
    deleteAccountConfirmDesc:
      "මෙය දින 30කින් සදහටම මකා දැමීමට ඔබේ ගිණුම සැලසුම් කරයි. එම කාලය තුළ නැවත login වී cancel කරන්නත් පුළුවන්.",
    whatGetsDeleted: "මැකෙන දේවල්:",
    deletedItem1:
      "සියලු ඇණවුම්, පාරිභෝගිකයන්, සහ නිෂ්පාදන",
    deletedItem2:
      "ඔබේ ව්‍යාපාර profile සහ logo",
    deletedItem3:
      "සියලු payment slips සහ ඇණවුම් ඉතිහාසය",
    deletedItem4:
      "ඔබේ login credentials",
    deletionGracePeriod:
      "දින 30 ඇතුළත නැවත login වුවහොත් සියල්ල නැවත සකස් කළ හැක.",
    typeToConfirm: "Type",
    enterPasswordToConfirm:
      "තහවුරු කිරීමට ඔබේ password දාන්න",
    typeDeleteToConfirm:
      "Confirmation box එකේ DELETE කියලා type කරන්න",
    passwordRequired: "Password අවශ්‍යයි",
    scheduleDeletion:
      "මැකීම සැලසුම් කරන්න",
    accountScheduledForDeletion:
      "ඔබේ ගිණුම මැකීමට සැලසුම් කර ඇත",
    daysUntilDeletion:
      "දින {days}ක් ඉතිරියි. {date} දින සදහටම මැකේ.",
    cancelDeletion: "මැකීම අවලංගු කරන්න",
    deletionCancelled:
      "මැකීම අවලංගු කෙරුවා — ඔබේ ගිණුම ආරක්ෂිතයි.",
    publicOrderForm: "පොදු ඇණවුම් form එක",
    publicOrderFormDesc:
      "පාරිභෝගිකයින්ට කෙලින්ම ඇණවුම් කරන්න පුළුවන් public URL එකක් share කරන්න. ලැබෙන ඇණවුම් ඔබේ inquiries inbox එකට යයි.",
    publicFormUrl: "Public URL",
    saveSlug: "URL save කරන්න",
    slugHint:
      "Lowercase අකුරු, ඉලක්කම්, සහ hyphens පමණයි. අකුරු 3-60ක්.",
    slugTaken:
      "මේ URL එක දැනටමත් භාවිතා වෙනවා. වෙන එකක් try කරන්න.",
    saveSlugFirst:
      "පළමුව ඔබේ URL එක save කරන්න",
    enablePublicForm:
      "Public form enable කරන්න",
    publicFormLive:
      "පාරිභෝගිකයින්ට දැන්ම ඇණවුම් කරන්න පුළුවන්",
    publicFormOff:
      "Form එක disabled — URL එක 'not available' පෙන්වයි",
    publicFormEnabled:
      "Public form දැන් live",
    publicFormDisabled:
      "Public form disable කෙරුවා",
    yourPublicUrl: "ඔබේ shop URL එක",
    shareUrlHint:
      "මෙය WhatsApp, Facebook, Instagram, හෝ ඔබේ bio එකේ share කරන්න.",
    urlCopied:
      "URL clipboard එකට copy කෙරුවා",
    copy: "Copy",
    copied: "Copy කෙරුවා!",
    publicFormPreview: "Open කරන්න",
    inquiryFromPublicForm:
      "ඔබේ public form එකෙන් අලුත් inquiry එකක්",
    inquiryReviewDesc:
      "පහත details review කරන්න. Confirm කලොත් මෙය real order එකක් වෙනවා, fake එකක් නම් reject කරන්න.",
    confirmInquiry:
      "ඇණවුම confirm කරන්න",
    rejectAsFake:
      "Fake එකක් ලෙස reject කරන්න",
    confirmRejectInquiry:
      "මේ inquiry එක fake එකක් ලෙස mark කරන්නද? එය cancelled වෙනවා.",
    inquiryConfirmed:
      "Inquiry confirm කෙරුවා — order එක දැන් active",
    inquiryRejected:
      "Inquiry reject වෙලා cancelled වුණා",
    inquiries: "Inquiries",
    inquiriesDesc:
      "ඔබගේ public form එකෙන් ලැබුණු ඇණවුම් review කිරීමට බලාපොරොත්තුවෙන් ඇත.",
    pendingReview:
      "Review බලාපොරොත්තුවෙන්",
    all: "සියල්ල",
    selected: "තෝරාගත්",
    confirmAll: "සියල්ල confirm කරන්න",
    rejectAll: "සියල්ල reject කරන්න",
    clear: "Clear",
    confirmBulkReject:
      "තෝරාගත් සියලු inquiries fake ලෙස reject කරන්නද? ඒවා cancelled වේ.",
    inquiriesConfirmedCount:
      "{count} inquiries confirm කළා",
    inquiriesRejectedCount:
      "{count} inquiries reject කළා",
    publicFormNotEnabled:
      "ඔබගේ public order form එක disable කර ඇත",
    publicFormNotEnabledDesc:
      "පාරිභෝගික inquiries ලබා ගැනීමට Settings වලින් enable කරන්න.",
    enableInSettings:
      "Settings වලින් enable කරන්න",
    searchInquiries: "Inquiries සොයන්න...",
    noPendingInquiries:
      "Pending inquiries නැහැ. සියල්ල අවසන්!",
    noRejectedInquiries:
      "Reject කළ inquiries නැහැ.",
    noInquiriesYet: "තවම inquiries නැහැ.",
    shareUrlForOrders:
      "ඇණවුම් ලබා ගැනීමට ඔබගේ public URL එක WhatsApp / social media වල share කරන්න.",
    when: "කවදාද",
    items: "භාණ්ඩ",
    item: "භාණ්ඩය",
    itemPlural: "භාණ්ඩ",
    duplicate: "Duplicate",
    duplicatePhoneWarning:
      "මෙම phone number එකෙන් තවත් pending inquiry එකක් ඇත. Fake එකක් විය හැක.",
    clickInquiryToReview:
      "Inquiry එකක් click කර full details බලා confirm හෝ reject කරන්න.",
    loadingInquiries: "Loading...",

    // ============ LANDING PAGE KEYS — SINHALA ============

    // FIX: Removed "#1" claim
    heroEyebrow:
      "ශ්‍රී ලාංකික online ව්‍යාපාර සඳහා සාදන ලදී",

    heroHeadline:
      "WhatsApp Chat සහ Paper Books වලට Orders නැතිවීම නවත්වන්න",

    // FIX: "Built for" → "Works with"
    heroSubheadline:
      "සෑම ඇණවුමක්ම, COD ගෙවීමක්ම, සහ courier dispatch එකක්ම — pending ඉඳන් delivered දක්වා — එක සරල dashboard එකකින් කළමනාකරණය කරන්න. Pronto, Domex, Koombiyo, Fardar සමඟ ක්‍රියා කරයි.",

    watchDemo: "ක්‍රියා කරන ආකාරය බලන්න",
    noCardNeeded: "Card එකක් අවශ්‍ය නැත",

    // FIX: Removed fake stats
    trustedBy: "ප්‍රධාන SL courier සියල්ල සමඟ ක්‍රියා කරයි",
    lkrProcessed: "Hidden fees නැත",
    packagesDispatched: "ඕනෑම වෙලාවක cancel කරන්න",

    painHeadline:
      "ශ්‍රී ලංකාවේ Online Store එකක් පවත්වාගෙන යාම Chaos එකක් නොවිය යුතුයි",
    painSubheadline:
      "හුරුපුරුදුද? මේවා Ordera නැති කරන්න හදපු දෛනික අරගල.",
    pain1Title: "කවුද ගෙව්වේ? කවුද නැත්තේ?",
    pain1Desc:
      "COD ගෙවීම් WhatsApp, bank slips, memory වල විසිරිලා. සෑම සතියකම revenue leak වෙනවා.",
    pain2Title:
      "මොන courierද? මොන waybill එකද?",
    pain2Desc:
      "Pronto, Domex, Koombiyo portals අතර මාරු වෙමින්, addresses copy-paste කරමින්, track එක නැති වෙනවා.",
    pain3Title: "කෝ ඒ order එක?",
    pain3Desc:
      "පාරිභෝගිකයෝ දවසට 5 සැරයක් call කරනවා. Team එක Excel හෝ Messenger වල status update කරන්න පැය ගණන් ගත කරනවා.",

    featuresHeadline:
      "එක තැනක්. සෑම Order එකක්ම. Chaos Zero.",
    featuresSubheadline:
      "ඔබේ ශ්‍රී ලාංකික ව්‍යාපාරය ඇත්තටම ක්‍රියාත්මක වන workflow එක.",
    feature1Title:
      "ඔබේ සියලුම Orders, එක Pipeline එකක",
    feature1Desc:
      "සෑම order එකක්ම Pending → Confirmed → Packed → Shipped → Delivered හරහා ගෙන යන්න. ඔබේ මුළු team එකටම එකම status එක real-time බලන්න පුළුවන්.",
    feature1Bullet1:
      "ක්ෂණික පැහැදිලි කමට color-coded status tags",
    feature1Bullet2:
      "එක click එකකින් orders ගොඩක් update කරන්න",
    feature1Bullet3:
      "WhatsApp හරහා customer notifications (ඉක්මණින් පැමිණේ)",
    feature2Title:
      "COD සහ බැංකු මාරු, අවසානයේ පාලනයට",
    feature2Desc:
      "Courier එක return වෙන විට payment collected කියලා mark කරන්න. Bank slips upload කරන්න. දිනපතා collection totals බලන්න.",
    feature2Bullet1:
      "දිනපතා COD collection report",
    feature2Bullet2:
      "Bank slip image upload & verification",
    feature2Bullet3:
      "Pending payment dashboard with alerts",
    feature3Title:
      "Ordera එකෙන් පිටවෙන්නේ නැතුව Dispatch කරන්න",
    feature3Desc:
      "Dropdown එකකින් Pronto, Domex, Koombiyo, හෝ Fardar assign කරන්න. Waybill paste කරන්න. Delivery status track කරන්න.",
    feature3Bullet1:
      "සියලුම ප්‍රධාන ශ්‍රී ලාංකික couriers සඳහා",
    feature3Bullet2:
      "Waybill history & tracking links",
    feature3Bullet3:
      "Courier performance comparison",
    feature4Title:
      "මුදල් කතා කරන Dashboard එකක්",
    feature4Desc:
      "රු. වලින් ආදායම, top products, daily trends — spreadsheets අවශ්‍ය නෑ. Real data මත පදනම්ව තීරණ ගන්න.",
    feature4Bullet1:
      "LKR revenue dashboards with trends",
    feature4Bullet2:
      "Top-selling products report",
    feature4Bullet3:
      "අවශ්‍ය විට Excel වලට export කරන්න",

    howItWorksHeadline:
      "Sign-Up සිට Smooth Operations දක්වා විනාඩි 10 ඇතුළත",
    step1Title: "ඔබේ ගිණුම සාදන්න",
    step1Desc:
      "ව්‍යාපාර නම, currency (LKR default), සහ courier preferences එකතු කරන්න. විනාඩි 2 ගතවේ.",
    step2Title:
      "ඔබේ පළමු order එක එකතු කරන්න",
    step2Desc:
      "Customer නම, items, value, payment method, courier. හෝ CSV එකකින් import කරන්න.",
    step3Title:
      "Move, dispatch, track කරන්න",
    step3Desc:
      "Team එක status update කරනවා. ඔබ dashboard එක දිහා බලනවා. Chaos එක ඉවරයි.",

    pricingHeadline:
      "ඔබේ Store එකත් එක්ක Grow වෙන Plans",
    pricingSubheadline:
      "සියලු මිල LKR වලින්. Hidden fees නැත. ඕනෑම වෙලාවක cancel කරන්න.",
    starterPlan: "Starter",
    growthPlan: "Growth",
    businessPlan: "Business",
    ordersUpTo: "Orders {count} දක්වා",
    mostPopular: "වඩාත් ජනප්‍රිය",

    // FIX: "Start Free Trial" → "Get started free"
    startTrial: "නොමිලේ ආරම්භ කරන්න",
    contactSales: "Sales අමතන්න",
    allPlansInclude:
      "සියලු plans වලට ඇතුළත්: සිංහල & English UI · Mobile-responsive · Secure data hosting · Bank slip verification",

    // Testimonials — keys kept but emptied (section removed from UI)
    testimonialsHeadline: "",
    testimonial1Quote: "",
    testimonial1Name: "",
    testimonial1Role: "",
    testimonial2Quote: "",
    testimonial2Name: "",
    testimonial2Role: "",
    testimonial3Quote: "",
    testimonial3Name: "",
    testimonial3Role: "",

    faqHeadline:
      "පොදු ප්‍රශ්න (සහ අවංක පිළිතුරු)",
    faq1Q: "මගේ data safeද?",
    faq1A: "ඔව්. Secure cloud hosting (Supabase on AWS) සහ encrypted storage. ඔබේ order සහ customer data කිසිවිටෙක share හෝ sell කරන්නේ නැත. සෑම merchant කෙනෙකුගේ data ම සම්පූර්ණයෙන් isolated.",
    faq2Q: "මට මෙය phone එකෙන් use කරන්න පුළුවන්ද?",
    faq2A: "අනිවාර්යයෙන්ම. Ordera fully mobile-responsive. Team එකට orders update කරන්න, payments check කරන්න, dispatch කරන්න ඕනෑම smartphone එකකින් පුළුවන් — app install අවශ්‍ය නැත.",
    faq3Q: "Cancel කරන්න ඕන වුණොත්?",
    faq3A: "Lock-in contracts නැත. Account settings වලින් ඕනෑම වෙලාවක cancel කරන්න. යන්න කලින් data export කරන්න — ඒ ඔබේ, අපේ නෙවෙයි.",

    // FIX: Removed "Q4 2026" specific date
    faq4Q: "Pronto/Domex APIs සමඟ directly integrate වෙනවද?",
    faq4A: "දැනට, waybills manually paste කරන්න. Courier APIs සමඟ direct integration අපේ roadmap එකේ — ready වූ විට notify කරන්නෙමු.",

    // FIX: Multi-user not built yet — updated to honest answer
    faq5Q: "මගේ staff ට access දෙන්න පුළුවන්ද?",
    faq5A: "Multi-user access with role-based permissions (Admin, Manager, Staff) paid plans සඳහා roadmap එකේ ඇත. දැනට single login. ඔබේ business සඳහා priority නම් අප හා සම්බන්ධ වන්න.",

    finalHeadline:
      "Paper Books සහ WhatsApp Chaos එක අතහරින්න සූදානම්ද?",

    // FIX: Removed "14-day trial" — no trial system
    finalSubheadline:
      "නොමිලේ ආරම්භ කරන්න — මාසිකව orders 50ක්, card අවශ්‍ය නැත. සිංහලෙන් හෝ English වලින් personal onboarding call එකක් ලබා ගන්න.",

    bookDemo:
      "WhatsApp හරහා demo book කරන්න",

    // FIX: Removed "200+ businesses" fabricated number
    joinBusinesses:
      "Beta කාලය නොමිලේ — card අවශ්‍ය නැත",
  },
} as const;

export type Dict = typeof dict.en;
export type DictKey = keyof Dict;

export function formatLKR(
  n: number | string | null | undefined
): string {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  })
    .format(v || 0)
    .replace("LKR", "Rs.");
}

export const COURIERS = [
  "Pronto",
  "Domex",
  "Koombiyo",
  "Fardar",
  "SiteVisit",
  "Aramex",
  "DHL",
  "Other",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_METHODS = [
  "cod",
  "bank_transfer",
  "cash",
] as const;

export const PAYMENT_STATUSES = [
  "unpaid",
  "paid",
  "pending_verification",
  "refunded",
] as const;