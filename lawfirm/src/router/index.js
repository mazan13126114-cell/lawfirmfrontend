// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

// Import views
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ClientDashboard from '../views/ClientDashboard.vue';
import LawyerDashboard from '../views/LawyerDashboard.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import Cases from '../views/Cases.vue';
import CaseDetail from '../views/CaseDetail.vue';
import Messages from '../views/Messages.vue';
import Profile from '../views/Profile.vue';
import Logout from '../views/Logout.vue';

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  
  // Client & Lawyer dashboards
  { path: '/dashboard/client', name: 'ClientDashboard', component: ClientDashboard },
  { path: '/dashboard/lawyer', name: 'LawyerDashboard', component: LawyerDashboard },
  
  // ✅ Admin goes to /admin
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard },
  
  // Other routes
  { path: '/cases', name: 'Cases', component: Cases },
  { path: '/cases/:id', name: 'CaseDetail', component: CaseDetail },
  { path: '/messages', name: 'Messages', component: Messages },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/logout', name: 'Logout', component: Logout },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const publicPages = ['Login', 'Register'];
  const authRequired = !publicPages.includes(to.name);

  if (authRequired && !token) {
    next('/');
    return;
  }

  // ✅ Redirect /dashboard to /admin for admins
  if (to.path === '/dashboard' && token) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      next('/admin'); // ✅ Go directly to /admin
      return;
    }
    if (user.role === 'lawyer') {
      next('/dashboard/lawyer');
      return;
    }
    next('/dashboard/client');
    return;
  }

  next();
});

export default router;