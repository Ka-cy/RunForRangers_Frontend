import { Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { AboutComponent } from './Default-Pages/about/about.component';
import { UpdateAdminComponent } from './Admin-Subsystem/update-admin/update-admin.component';
import { RegisterComponent } from './Default-Pages/register/register.component';
import { RunnerPageComponent } from './Default-Pages/runner-page/runner-page.component';
import { SignInComponent } from './Default-Pages/sign-in/sign-in.component';
import { HomeComponent } from './Default-Pages/home/home.component';
import { DashboardAdminComponent } from './Admin-Subsystem/dashboard-admin/dashboard-admin.component';
import { EditUserProfileComponent } from './User-Subsystem/edit-user-profile/edit-user-profile.component';
import { ProductDashboardComponent } from './Product-Subsystem/product-dashboard/product-dashboard.component';
import{ CreateProductComponent } from './Product-Subsystem/create-product/create-product.component';
import { CreateCategoryComponent } from './Product-Subsystem/create-category/create-category.component';
import { CreateTypeComponent } from './Product-Subsystem/create-type/create-type.component';
import { EditProductComponent } from './Product-Subsystem/edit-product/edit-product.component';
import { CreateEmployeeComponent } from './Employee-Subsystem/create-employee/create-employee.component';
import { EmployeeDashboardComponent } from './Employee-Subsystem/employee-dashboard/employee-dashboard.component';
import { UpdateEmployeeComponent } from './Employee-Subsystem/update-employee/update-employee.component';
import { EditExpenditureComponent } from './Expenditure-Subsystem/create-expenditure/edit-expenditure/edit-expenditure.component';
import { ExpenditureReportComponent } from './Expenditure-Subsystem/expenditure-report/expenditure-report.component';
import { RunnerDashboardComponent } from './Runner-Subsystem/runner-dashboard/runner-dashboard.component';
import {AdminViewRunnerComponent}   from './Runner-Subsystem/admin-view-runner/admin-view-runner.component'
import { UpdateRunnerComponent } from './Runner-Subsystem/update-runner/update-runner.component';
import { CreateExpenditureComponent } from './Expenditure-Subsystem/create-expenditure/create-expenditure.component';
import { ExpenditureHomeComponent } from './Expenditure-Subsystem/home-expenditure/expenditure-home.component';
import {RegisterRunnerComponent} from './Runner-Subsystem/register-runner/register-runner.component'
import { A, D, T } from '@angular/cdk/keycodes';
import { ForgetPasswordComponent } from './Forget Password/forget-passord/forget-passord.component';
import { DonationDashboardComponent } from './Donation-Subsystem/donation-dashboard/donation-dashboard.component';
import { LogDonationComponent } from './Donation-Subsystem/log-donation/log-donation.component';
import { EditDonationComponent } from './Donation-Subsystem/edit-donation/edit-donation.component';
import { AdminHomeComponent } from './Admin-Subsystem/admin-home/admin-home.component';
import { CreateAdminComponent } from './Admin-Subsystem/create-admin/create-admin.component';
import { ShopComponent } from './Default-Pages/shop/shop/shop.component';
import { CartComponent } from './Default-Pages/shop/cart/cart.component';
import { InventoryComponent } from './Inventory-Subsystem/inventory/inventory.component';
import { ReceiveStockComponent } from './Inventory-Subsystem/receive-stock/receive-stock.component';
import { WriteOffComponent } from './Inventory-Subsystem/write-off/write-off.component';
import { StockTakeComponent } from './Inventory-Subsystem/stock-take/stock-take.component';
import { ManageCategoriesComponent } from './Product-Subsystem/manage-categories/manage-categories.component';
import { ManageTypesComponent } from './Product-Subsystem/manage-types/manage-types.component';
import { ManageColorsComponent } from './Product-Subsystem/manage-colors/manage-colors.component';
import { ManageSizesComponent } from './Product-Subsystem/manage-sizes/manage-sizes.component';
import { AddInventoryComponent } from './Inventory-Subsystem/add-inventory/add-inventory.component';
import { StockTakeListComponent } from './Inventory-Subsystem/stock-take-list/stock-take-list.component';
import { WriteOffListComponent } from './Inventory-Subsystem/write-off-list/write-off-list.component';
import { ReceiveStockListComponent } from './Inventory-Subsystem/receive-stock-list/receive-stock-list.component';
import { EventHomeComponent } from './events/event-home/event-home.component';
import { CreateEventComponent } from './events/create-event/create-event.component';
import { CompletedEventsComponent } from './events/completed-events/completed-events.component';
import { UpdateEventComponent } from './events/update-event/update-event.component';
import { CreateJobComponent } from './events/create-job/create-job.component';
import { UpdateJobComponent } from './events/update-job/update-job.component';
import { EventCalendarComponent } from './events/event-calendar/event-calendar.component';
import { DeliveryDashboardComponent } from './Delivery-Subsystem/delivery-dashboard/delivery-dashboard.component';
import { EventsPageComponent } from './Default-Pages/events-page/events-page.component';
import { EditDeliveryComponent } from './Delivery-Subsystem/edit-delivery/edit-delivery.component';
import { DeleteDeliveryComponent } from './Delivery-Subsystem/delete-delivery/delete-delivery.component';
import { ManageCouriersComponent } from './Delivery-Subsystem/manage-couriers/manage-couriers.component';
import { DeliveryAnalyticsComponent } from './Delivery-Subsystem/delivery-analytics/delivery-analytics.component';
import { ProductAnalyticsComponent } from './Product-Subsystem/product-analytics/product-analytics.component';
import { CheckoutComponent } from './Default-Pages/shop/checkout/checkout.component';
import { OrderDashboardComponent } from './Order-Subsystem/order-dashboard/order-dashboard.component';
import { OrderSuccessComponent } from './Order-Subsystem/order-success/order-success.component';
import { ReportsdashboardComponent } from './Reports-Subsystem/reportsdashboard/reportsdashboard.component';
import { AdminHelpComponent } from './Admin-Subsystem/admin-help/admin-help.component';
import { PaymentComponent } from './Default-Pages/shop/payment/payment.component';
import { OrganisationDonationReportComponent } from './Reports-Subsystem/organisation-donation-report/organisation-donation-report.component';
import { RunnerDonationReportComponent } from './Reports-Subsystem/runner-donation-report/runner-donation-report.component';
import { SalesReportComponent } from './Reports-Subsystem/sales-report/sales-report.component';
import { TwoFAPageComponent } from './two-fa-page/two-fa-page.component';

import { HelpSectionComponent } from './Default-Pages/help-section/help-section.component';
import { UpdateMilestoneComponent } from './Milestone-Subsystem/update-milestone/update-milestone.component';
import {RunnerMilestoneComponent} from   './Runner-Subsystem/runner-milestone/runner-milestone.component'
import { EditRunnerProfileComponent } from './Runner-Subsystem/edit-runner-profile/edit-runner-profile.component';
import { AdminRoleUpdateComponent } from './Admin-Subsystem/admin-role-update/admin-role-update.component';
import { ConfigureTimerOtpComponent } from './Admin-Subsystem/configure-timer-otp/configure-timer-otp.component';

import { AuthGuard } from './auth.guard';
import { UpdatePasswordComponent } from './Default-Pages/update-password/update-password.component';
import { DonationReportComponent } from './Reports-Subsystem/donation-report/donation-report.component';
import {NotificationDetailComponent } from './notification-detail/notification-detail.component';
import { NotificationsListComponent } from './notifications-list/notifications-list.component';
import { RunnerNotificationsListComponent } from './runner-notifications-list/runner-notifications-list.component';
import { FileUploadComponent } from './Donation-Subsystem/file-upload/file-upload.component';












export const routes: Routes = [
    { path: 'event-registration/:eventId', loadComponent: () => import('./Event-Registration/event-registration.component').then(m => m.EventRegistrationComponent) },
    // Default route
    {path: '',redirectTo: 'home', pathMatch: 'full'},
    {path: 'home', component: HomeComponent},
    {path: 'about', component: AboutComponent},
    {path: 'register', component: RegisterComponent},
    {path: 'signIn', component: SignInComponent},
    {path: 'runner-page', component:RunnerPageComponent},
    {path: 'help-section',component:HelpSectionComponent},
    {path: 'twoFA-page',component: TwoFAPageComponent},
    {path: 'update-password', component: UpdatePasswordComponent},

    {path: 'notification-detail', component: NotificationDetailComponent},
    {path: 'notifications', component: NotificationsListComponent, canActivate: [AuthGuard]},
    {path: 'runner-notifications', component: RunnerNotificationsListComponent},




    // Admin routes
    {path: 'admin-home', component: AdminHomeComponent,canActivate: [AuthGuard]},
    {path: 'create-admin', component: CreateAdminComponent,canActivate: [AuthGuard]},
    {path: 'update-admin', component: UpdateAdminComponent,canActivate: [AuthGuard]},
   {path: 'admin-help',component:AdminHelpComponent,canActivate: [AuthGuard]},
   {path: 'update-role', component: AdminRoleUpdateComponent,canActivate: [AuthGuard]},
   {path: 'otp-configure', component: ConfigureTimerOtpComponent, canActivate: [AuthGuard]},


 
   {path:'dashboard',component: DashboardAdminComponent,canActivate: [AuthGuard]},

   {path:'edit-user-profile',component:EditUserProfileComponent},
   {path: 'createexpenditure', component:CreateExpenditureComponent,canActivate: [AuthGuard]},

   // Forget Password routes
   {path:'forget-password', component: ForgetPasswordComponent},

//Product routes
    {path: 'products', component: ProductDashboardComponent,canActivate: [AuthGuard]},
    {path: 'products/add', component: CreateProductComponent,canActivate: [AuthGuard] },
    {path: 'products/analytics', component: ProductAnalyticsComponent,canActivate: [AuthGuard]},
    {path: 'category/add', component: CreateCategoryComponent,canActivate: [AuthGuard]},
    {path: 'types/add', component: CreateTypeComponent,canActivate: [AuthGuard]},
    {path: 'products/edit/:id', component: EditProductComponent,canActivate: [AuthGuard]},

    // Product Management routes
    {path: 'products/manage-categories', component: ManageCategoriesComponent,canActivate: [AuthGuard]},
    {path: 'products/manage-types', component: ManageTypesComponent,canActivate: [AuthGuard]},
    {path: 'products/manage-colors', component: ManageColorsComponent,canActivate: [AuthGuard]} ,
    {path: 'products/manage-sizes', component: ManageSizesComponent,canActivate: [AuthGuard]},
//employee routes
    {path: 'employees', component :EmployeeDashboardComponent,canActivate: [AuthGuard] },
    {path: 'employees/add', component :CreateEmployeeComponent,canActivate: [AuthGuard]},
    {path: 'employees/edit/:id', component :UpdateEmployeeComponent,canActivate: [AuthGuard]},
    //{ path: 'products/add', component: CreateProductComponent },

//Donation routes
     { path: 'donations', component: DonationDashboardComponent,canActivate: [AuthGuard] },
     { path: 'log-donation', component: LogDonationComponent,canActivate: [AuthGuard] },
     { path: 'edit-donation/:id', component: EditDonationComponent,canActivate: [AuthGuard] },
     { path: 'file-upload', component: FileUploadComponent, canActivate: [AuthGuard] },


//Runner routes
     {path: 'runners', component :RunnerDashboardComponent,canActivate: [AuthGuard] },
    {path: 'runners/register', component :RegisterRunnerComponent},
    {path: 'runners/edit', component :UpdateRunnerComponent,canActivate: [AuthGuard]},
    { path: 'runners/view/:id', component: AdminViewRunnerComponent,canActivate: [AuthGuard] },
    {path : 'runner-milestone', component:RunnerMilestoneComponent},
    {path : 'edit-runner-profile', component:EditRunnerProfileComponent},



    //Milestone route
    {path: 'milestone/update',component :UpdateMilestoneComponent},

//Expenditure routes
    {path: 'create-expenditure', component:CreateExpenditureComponent,canActivate: [AuthGuard]},
    {path: 'expenditure-home', component:ExpenditureHomeComponent,canActivate: [AuthGuard]},
     { path: '', redirectTo: 'expenditure-home', pathMatch: 'full' },
     {path: 'edit-expenditure', component:EditExpenditureComponent,canActivate: [AuthGuard]},
     {path: 'expenditure-report', component:ExpenditureReportComponent,canActivate: [AuthGuard]},


  //event routes
    { path: 'events-page', component: EventsPageComponent },
    { path: 'events', component: EventHomeComponent,canActivate: [AuthGuard]},
    { path: 'events/calendar', component: EventCalendarComponent,canActivate: [AuthGuard] },
    { path: 'create-event', component: CreateEventComponent,canActivate: [AuthGuard] },
    { path: 'completed-events', component: CompletedEventsComponent,canActivate: [AuthGuard] },
    { path: 'update-event/:id', component: UpdateEventComponent,canActivate: [AuthGuard] },
    { path: 'create-job', component: CreateJobComponent,canActivate: [AuthGuard] },
    { path: 'update-job/:id', component: UpdateJobComponent,canActivate: [AuthGuard] },


    //shop routes
    {path: 'shop', component: ShopComponent},
    {path : 'cart', component: CartComponent},
    {path : 'checkout', component: CheckoutComponent},
    {path : 'payment', component: PaymentComponent},
    {path : 'order-success', component: OrderSuccessComponent},

    //Order routes (admin)
    {path: 'admin/orders', component: OrderDashboardComponent},

    //Inventory routes

    {path : 'inventory' , component:InventoryComponent},
    {path :  'inventory/add', component:AddInventoryComponent},
    {path :  'add-inventory/:id', component:AddInventoryComponent},
    {path : 'inventory/receive-stock' , component:ReceiveStockComponent},
    {path : 'inventory/write-off' , component:WriteOffComponent},
    {path : 'inventory/stock-take' , component:StockTakeComponent},

    // New Inventory List routes for bulk operations
    {path : 'inventory/stock-take-list' , component:StockTakeListComponent},
    {path : 'inventory/write-off-list' , component:WriteOffListComponent},
    {path : 'inventory/receive-stock-list' , component:ReceiveStockListComponent},

    //Delivery routes
    {path: 'delivery', component: DeliveryDashboardComponent,canActivate: [AuthGuard]},
    {path: 'delivery/edit/:id', component: EditDeliveryComponent,canActivate: [AuthGuard]},
    {path: 'delivery/delete/:id', component: DeleteDeliveryComponent,canActivate: [AuthGuard]},
    {path: 'manage-couriers', component: ManageCouriersComponent,canActivate: [AuthGuard]},
    {path: 'delivery-analytics', component: DeliveryAnalyticsComponent,canActivate: [AuthGuard]},

    //Reports routes
    { path : 'reports' , component: ReportsdashboardComponent },
    { path : 'reports/donation' , component: DonationReportComponent },
    { path : 'reports/organisation-donation' , component: OrganisationDonationReportComponent },
    { path : 'reports/runner-donation' , component: RunnerDonationReportComponent },
    { path : 'reports/sales' , component: SalesReportComponent },
     {path: 'reports/expenditure', component:ExpenditureReportComponent},

];
