import { onRequestPost as __api_backup_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\backup.js"
import { onRequestDelete as __api_delete_js_onRequestDelete } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\delete.js"
import { onRequestDelete as __api_delete_all_js_onRequestDelete } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\delete-all.js"
import { onRequestGet as __api_download_js_onRequestGet } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\download.js"
import { onRequestDelete as __api_login_js_onRequestDelete } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\login.js"
import { onRequestGet as __api_login_js_onRequestGet } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\login.js"
import { onRequestPost as __api_login_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\login.js"
import { onRequestGet as __api_logs_js_onRequestGet } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\logs.js"
import { onRequestPost as __api_logs_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\logs.js"
import { onRequestPost as __api_month_lock_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\month-lock.js"
import { onRequestPost as __api_music_recommend_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\music-recommend.js"
import { onRequestDelete as __api_notifications_js_onRequestDelete } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\notifications.js"
import { onRequestGet as __api_notifications_js_onRequestGet } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\notifications.js"
import { onRequestPost as __api_notifications_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\notifications.js"
import { onRequestPut as __api_notifications_js_onRequestPut } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\notifications.js"
import { onRequestGet as __api_projects_js_onRequestGet } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\projects.js"
import { onRequestPost as __api_projects_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\projects.js"
import { onRequestPost as __api_reset_month_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\reset-month.js"
import { onRequestPost as __api_reset_year_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\reset-year.js"
import { onRequestPost as __api_restore_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\restore.js"
import { onRequestPost as __api_upload_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\upload.js"
import { onRequestDelete as __api_users_js_onRequestDelete } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\users.js"
import { onRequestGet as __api_users_js_onRequestGet } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\users.js"
import { onRequestPost as __api_users_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\users.js"
import { onRequestPut as __api_users_js_onRequestPut } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\users.js"

export const routes = [
    {
      routePath: "/api/backup",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_backup_js_onRequestPost],
    },
  {
      routePath: "/api/delete",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_delete_js_onRequestDelete],
    },
  {
      routePath: "/api/delete-all",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_delete_all_js_onRequestDelete],
    },
  {
      routePath: "/api/download",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_download_js_onRequestGet],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_login_js_onRequestDelete],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_login_js_onRequestGet],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_login_js_onRequestPost],
    },
  {
      routePath: "/api/logs",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_logs_js_onRequestGet],
    },
  {
      routePath: "/api/logs",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_logs_js_onRequestPost],
    },
  {
      routePath: "/api/month-lock",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_month_lock_js_onRequestPost],
    },
  {
      routePath: "/api/music-recommend",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_music_recommend_js_onRequestPost],
    },
  {
      routePath: "/api/notifications",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_notifications_js_onRequestDelete],
    },
  {
      routePath: "/api/notifications",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_notifications_js_onRequestGet],
    },
  {
      routePath: "/api/notifications",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_notifications_js_onRequestPost],
    },
  {
      routePath: "/api/notifications",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_notifications_js_onRequestPut],
    },
  {
      routePath: "/api/projects",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_projects_js_onRequestGet],
    },
  {
      routePath: "/api/projects",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_projects_js_onRequestPost],
    },
  {
      routePath: "/api/reset-month",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_reset_month_js_onRequestPost],
    },
  {
      routePath: "/api/reset-year",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_reset_year_js_onRequestPost],
    },
  {
      routePath: "/api/restore",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_restore_js_onRequestPost],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_js_onRequestPost],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_users_js_onRequestDelete],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_users_js_onRequestGet],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_users_js_onRequestPost],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_users_js_onRequestPut],
    },
  ]