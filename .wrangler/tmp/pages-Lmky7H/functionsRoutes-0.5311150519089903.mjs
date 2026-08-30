import { onRequestGet as __api_backup_js_onRequestGet } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\backup.js"
import { onRequestDelete as __api_delete_all_js_onRequestDelete } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\delete-all.js"
import { onRequestPost as __api_login_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\login.js"
import { onRequestPost as __api_month_lock_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\month-lock.js"
import { onRequestPost as __api_music_recommend_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\music-recommend.js"
import { onRequestGet as __api_projects_js_onRequestGet } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\projects.js"
import { onRequestPost as __api_projects_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\projects.js"
import { onRequestPost as __api_reset_month_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\reset-month.js"
import { onRequestPost as __api_reset_year_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\reset-year.js"
import { onRequestPost as __api_restore_js_onRequestPost } from "C:\\Users\\yang\\Documents\\project-platform\\functions\\api\\restore.js"

export const routes = [
    {
      routePath: "/api/backup",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_backup_js_onRequestGet],
    },
  {
      routePath: "/api/delete-all",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_delete_all_js_onRequestDelete],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_login_js_onRequestPost],
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
  ]