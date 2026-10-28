import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import FullScreenLoader from "./components/common/FullScreenLoader";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import RequirePermission from "./routes/RequirePermission";
import { accessByPath, superAdminSubPathAccess } from "./config/navigation";

// Route-level code splitting: every page is lazy-loaded so heavy libs
// (apexcharts, fullcalendar, …) land in per-route chunks, not the initial bundle.
const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const ForgotPassword = lazy(() => import("./pages/AuthPages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/AuthPages/ResetPassword"));
const AcceptInvitation = lazy(() => import("./pages/AuthPages/AcceptInvitation"));
const EmailVerified = lazy(() => import("./pages/AuthPages/EmailVerified"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const Home = lazy(() => import("./features/dashboard/pages/DashboardHomePage"));
const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const Calendar = lazy(() => import("./pages/Calendar"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));
const Blank = lazy(() => import("./pages/Blank"));
const IncidentListPage = lazy(() => import("./features/incidents/pages/IncidentListPage"));
const IncidentDetailPage = lazy(() => import("./features/incidents/pages/IncidentDetailPage"));
const ResponderListPage = lazy(() => import("./features/responders/pages/ResponderListPage"));
const ResponderDetailPage = lazy(() => import("./features/responders/pages/ResponderDetailPage"));
const RosterPage = lazy(() => import("./features/roster/pages/RosterPage"));
const EmergencyListPage = lazy(() => import("./features/emergencies/pages/EmergencyListPage"));
const EmergencyDetailPage = lazy(() => import("./features/emergencies/pages/EmergencyDetailPage"));
const AssignmentListPage = lazy(() => import("./features/assignments/pages/AssignmentListPage"));
const AssignmentDetailPage = lazy(() => import("./features/assignments/pages/AssignmentDetailPage"));
const TrackingPage = lazy(() => import("./features/tracking/pages/TrackingPage"));
const EvidenceConsolePage = lazy(() => import("./features/evidence/pages/EvidenceConsolePage"));
const IntelConsolePage = lazy(() => import("./features/intel/pages/IntelConsolePage"));
const HardwareConsolePage = lazy(() => import("./features/hardware/pages/HardwareConsolePage"));
const LiveMonitoringPage = lazy(() => import("./features/camera-feeds/pages/LiveMonitoringPage"));
const CameraViewerPage = lazy(() => import("./features/camera-feeds/pages/CameraViewerPage"));
const CameraSourcesPage = lazy(() => import("./features/camera-feeds/pages/CameraSourcesPage"));
const FacilityMapPage = lazy(() => import("./features/facility/pages/FacilityMapPage"));
const DetectionsPage = lazy(() => import("./features/detections/pages/DetectionsPage"));
const AiAnalyticsPage = lazy(() => import("./features/intel/pages/AiAnalyticsPage"));
const AccessConsolePage = lazy(() => import("./features/access/pages/AccessConsolePage"));
const WebhooksConsolePage = lazy(() => import("./features/webhooks/pages/WebhooksConsolePage"));
const InsuranceConsolePage = lazy(() => import("./features/insurance/pages/InsuranceConsolePage"));
const RetentionConsolePage = lazy(() => import("./features/retention/pages/RetentionConsolePage"));
const BillingConsolePage = lazy(() => import("./features/billing/pages/BillingConsolePage"));
const TripListPage = lazy(() => import("./features/trips/pages/TripListPage"));
const TripDetailPage = lazy(() => import("./features/trips/pages/TripDetailPage"));
const PlatformSnapshotPage = lazy(() => import("./features/core/pages/PlatformSnapshotPage"));
const AssistantPage = lazy(() => import("./features/core/pages/AssistantPage"));
const RolesPage = lazy(() => import("./features/authorization/pages/RolesPage"));
const NotificationsPage = lazy(() => import("./features/notifications/pages/NotificationsPage"));
const AuditLogPage = lazy(() => import("./features/audit/pages/AuditLogPage"));
const SettingsPage = lazy(() => import("./features/settings/pages/SettingsPage"));
const ContactSupportPage = lazy(() => import("./features/support/pages/ContactSupportPage"));
const AdminOverviewPage = lazy(() => import("./features/admin/pages/AdminOverviewPage"));
const SuperAdminOverviewPage = lazy(() => import("./features/superadmin/pages/SuperAdminOverviewPage"));
const LeadListPage = lazy(() => import("./features/crm/pages/LeadListPage"));
const LeadDetailPage = lazy(() => import("./features/crm/pages/LeadDetailPage"));
const LedgerConsolePage = lazy(() => import("./features/ledger/pages/LedgerConsolePage"));
const RidesOpsConsolePage = lazy(() => import("./features/ridesops/pages/RidesOpsConsolePage"));
const CommandConsolePage = lazy(() => import("./features/command/pages/CommandConsolePage"));
const SecurityPosturePage = lazy(() => import("./features/superadmin/pages/SecurityPosturePage"));
const SupportQueuePage = lazy(() => import("./features/superadmin/pages/SupportQueuePage"));
const VerificationsQueuePage = lazy(() => import("./features/superadmin/pages/VerificationsQueuePage"));
const ConsumerVisionPage = lazy(() => import("./features/superadmin/pages/ConsumerVisionPage"));
const RoadRiskPage = lazy(() => import("./features/roadrisk/pages/RoadRiskPage"));
const CommunityModerationPage = lazy(() => import("./features/community/pages/CommunityModerationPage"));
const SubscriptionsOverviewPage = lazy(() => import("./features/superadmin/pages/SubscriptionsOverviewPage"));
const OrganizationsDirectoryPage = lazy(() => import("./features/superadmin/pages/OrganizationsDirectoryPage"));
const OrganizationDetailPage = lazy(() => import("./features/superadmin/pages/OrganizationDetailPage"));

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            {/* Guest-only (auth) */}
            <Route element={<GuestRoute />}>
              <Route path="/signin" element={<SignIn />} />
            </Route>

            {/*
              Password reset: reachable regardless of auth state (the emailed
              reset link — see IdentityServiceProvider — should always work,
              even for someone currently signed in as a different account), so
              these sit outside both GuestRoute and ProtectedRoute.
            */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/password/reset/:token" element={<ResetPassword />} />

            {/*
              Accept invitation: the emailed "Accept invitation" link
              (OrganizationInvitationNotification::toMail()) opens directly
              here. Same reasoning as password reset above — must work
              regardless of auth state, since the visitor may have no
              session yet at all, or may be signed in as a different account.
            */}
            <Route path="/invitations/:token/accept" element={<AcceptInvitation />} />

            {/*
              Email verification: the emailed "Verify Email Address" link
              (VerifyEmailController::__invoke() on the backend) redirects
              here with ?status=success on completion. Same reasoning as
              password reset / accept-invitation above — must work regardless
              of auth state.
            */}
            <Route path="/email/verified" element={<EmailVerified />} />

            {/* Authenticated console */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* Overview */}
                <Route index path="/" element={<Home />} />

                {/* Sentrix sections — guarded by the same access rule as the nav */}
                <Route element={<RequirePermission rule={accessByPath["/incidents"]} />}>
                  <Route path="/incidents" element={<IncidentListPage />} />
                  <Route path="/incidents/:id" element={<IncidentDetailPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/emergencies"]} />}>
                  <Route path="/emergencies" element={<EmergencyListPage />} />
                  <Route path="/emergencies/:id" element={<EmergencyDetailPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/responders"]} />}>
                  <Route path="/responders" element={<ResponderListPage />} />
                  <Route path="/responders/:id" element={<ResponderDetailPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/roster"]} />}>
                  <Route path="/roster" element={<RosterPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/assignments"]} />}>
                  <Route path="/assignments" element={<AssignmentListPage />} />
                  <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/tracking"]} />}>
                  <Route path="/tracking" element={<TrackingPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/evidence"]} />}>
                  <Route path="/evidence" element={<EvidenceConsolePage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/intel"]} />}>
                  <Route path="/intel" element={<IntelConsolePage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/hardware"]} />}>
                  <Route path="/hardware" element={<HardwareConsolePage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/vision-guard/live"]} />}>
                  <Route path="/vision-guard/live" element={<LiveMonitoringPage />} />
                  <Route path="/vision-guard/live/:sourceId" element={<CameraViewerPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/vision-guard/camera-sources"]} />}>
                  <Route path="/vision-guard/camera-sources" element={<CameraSourcesPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/vision-guard/facility-map"]} />}>
                  <Route path="/vision-guard/facility-map" element={<FacilityMapPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/vision-guard/detections"]} />}>
                  <Route path="/vision-guard/detections" element={<DetectionsPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/vision-guard/ai-analytics"]} />}>
                  <Route path="/vision-guard/ai-analytics" element={<AiAnalyticsPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/access"]} />}>
                  <Route path="/access" element={<AccessConsolePage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/webhooks"]} />}>
                  <Route path="/webhooks" element={<WebhooksConsolePage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/insurance"]} />}>
                  <Route path="/insurance" element={<InsuranceConsolePage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/retention"]} />}>
                  <Route path="/retention" element={<RetentionConsolePage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/billing"]} requireOrgMembership />}>
                  <Route path="/billing" element={<BillingConsolePage />} />
                </Route>
                <Route path="/assistant" element={<AssistantPage />} />
                <Route element={<RequirePermission rule={accessByPath["/trips"]} />}>
                  <Route path="/trips" element={<TripListPage />} />
                  <Route path="/trips/:id" element={<TripDetailPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/platform-snapshot"]} />}>
                  <Route path="/platform-snapshot" element={<PlatformSnapshotPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/roles"]} />}>
                  <Route path="/roles" element={<RolesPage />} />
                </Route>
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route element={<RequirePermission rule={accessByPath["/audit"]} />}>
                  <Route path="/audit" element={<AuditLogPage />} />
                </Route>
                <Route path="/settings" element={<SettingsPage />} />
                <Route element={<RequirePermission rule={accessByPath["/support"]} />}>
                  <Route path="/support" element={<ContactSupportPage />} />
                </Route>
                <Route element={<RequirePermission rule={accessByPath["/admin"]} />}>
                  <Route path="/admin" element={<AdminOverviewPage />} />
                </Route>
                {/*
                  The overview page itself just needs ANY platform-staff
                  permission (it only renders the tiles/actions the viewer
                  actually holds — see SuperAdminOverviewPage). Each sub-page
                  below gets its OWN specific guard instead of sharing one
                  blanket gate, same as every other console section above —
                  a SentrixEngineer or OnboardingManager is real platform
                  staff, not a SuperAdmin, and must not be blocked from the
                  one section they actually hold permission for.
                */}
                <Route element={<RequirePermission rule={accessByPath["/superadmin"]} />}>
                  <Route path="/superadmin" element={<SuperAdminOverviewPage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/leads"]} />}>
                  <Route path="/superadmin/leads" element={<LeadListPage />} />
                  <Route path="/superadmin/leads/:id" element={<LeadDetailPage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/ledger"]} />}>
                  <Route path="/superadmin/ledger" element={<LedgerConsolePage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/rides-ops"]} />}>
                  <Route path="/superadmin/rides-ops" element={<RidesOpsConsolePage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/command"]} />}>
                  <Route path="/superadmin/command" element={<CommandConsolePage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/security"]} />}>
                  <Route path="/superadmin/security" element={<SecurityPosturePage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/support"]} />}>
                  <Route path="/superadmin/support" element={<SupportQueuePage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/verifications"]} />}>
                  <Route path="/superadmin/verifications" element={<VerificationsQueuePage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/consumer-vision"]} />}>
                  <Route path="/superadmin/consumer-vision" element={<ConsumerVisionPage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/road-risk"]} />}>
                  <Route path="/superadmin/road-risk" element={<RoadRiskPage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/community"]} />}>
                  <Route path="/superadmin/community" element={<CommunityModerationPage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/subscriptions"]} />}>
                  <Route path="/superadmin/subscriptions" element={<SubscriptionsOverviewPage />} />
                </Route>
                <Route element={<RequirePermission rule={superAdminSubPathAccess["/superadmin/organizations"]} />}>
                  <Route path="/superadmin/organizations" element={<OrganizationsDirectoryPage />} />
                  <Route path="/superadmin/organizations/:id" element={<OrganizationDetailPage />} />
                </Route>

                {/* Template component reference pages (kept; not in production nav) */}
                <Route path="/profile" element={<UserProfiles />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/blank" element={<Blank />} />
                <Route path="/form-elements" element={<FormElements />} />
                <Route path="/basic-tables" element={<BasicTables />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/avatars" element={<Avatars />} />
                <Route path="/badge" element={<Badges />} />
                <Route path="/buttons" element={<Buttons />} />
                <Route path="/images" element={<Images />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/line-chart" element={<LineChart />} />
                <Route path="/bar-chart" element={<BarChart />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}
