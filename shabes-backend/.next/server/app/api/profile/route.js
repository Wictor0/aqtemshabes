"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/profile/route";
exports.ids = ["app/api/profile/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fprofile%2Froute&page=%2Fapi%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fprofile%2Froute.js&appDir=C%3A%5CUsers%5Cdyego%5CDocuments%5Caqtemshabes-shabes-dyego-branch%5Cshabes-backend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cdyego%5CDocuments%5Caqtemshabes-shabes-dyego-branch%5Cshabes-backend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fprofile%2Froute&page=%2Fapi%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fprofile%2Froute.js&appDir=C%3A%5CUsers%5Cdyego%5CDocuments%5Caqtemshabes-shabes-dyego-branch%5Cshabes-backend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cdyego%5CDocuments%5Caqtemshabes-shabes-dyego-branch%5Cshabes-backend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_dyego_Documents_aqtemshabes_shabes_dyego_branch_shabes_backend_app_api_profile_route_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/profile/route.js */ \"(rsc)/./app/api/profile/route.js\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/profile/route\",\n        pathname: \"/api/profile\",\n        filename: \"route\",\n        bundlePath: \"app/api/profile/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\dyego\\\\Documents\\\\aqtemshabes-shabes-dyego-branch\\\\shabes-backend\\\\app\\\\api\\\\profile\\\\route.js\",\n    nextConfigOutput,\n    userland: C_Users_dyego_Documents_aqtemshabes_shabes_dyego_branch_shabes_backend_app_api_profile_route_js__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/profile/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZwcm9maWxlJTJGcm91dGUmcGFnZT0lMkZhcGklMkZwcm9maWxlJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGcHJvZmlsZSUyRnJvdXRlLmpzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNkeWVnbyU1Q0RvY3VtZW50cyU1Q2FxdGVtc2hhYmVzLXNoYWJlcy1keWVnby1icmFuY2glNUNzaGFiZXMtYmFja2VuZCU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q1VzZXJzJTVDZHllZ28lNUNEb2N1bWVudHMlNUNhcXRlbXNoYWJlcy1zaGFiZXMtZHllZ28tYnJhbmNoJTVDc2hhYmVzLWJhY2tlbmQmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQ3lEO0FBQ3RJO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnSEFBbUI7QUFDM0M7QUFDQSxjQUFjLHlFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsaUVBQWlFO0FBQ3pFO0FBQ0E7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDdUg7O0FBRXZIIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vc2hhYmVzLWJhY2tlbmQtYXBpLz81ZGYyIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkM6XFxcXFVzZXJzXFxcXGR5ZWdvXFxcXERvY3VtZW50c1xcXFxhcXRlbXNoYWJlcy1zaGFiZXMtZHllZ28tYnJhbmNoXFxcXHNoYWJlcy1iYWNrZW5kXFxcXGFwcFxcXFxhcGlcXFxccHJvZmlsZVxcXFxyb3V0ZS5qc1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvcHJvZmlsZS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3Byb2ZpbGVcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL3Byb2ZpbGUvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxkeWVnb1xcXFxEb2N1bWVudHNcXFxcYXF0ZW1zaGFiZXMtc2hhYmVzLWR5ZWdvLWJyYW5jaFxcXFxzaGFiZXMtYmFja2VuZFxcXFxhcHBcXFxcYXBpXFxcXHByb2ZpbGVcXFxccm91dGUuanNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL3Byb2ZpbGUvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fprofile%2Froute&page=%2Fapi%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fprofile%2Froute.js&appDir=C%3A%5CUsers%5Cdyego%5CDocuments%5Caqtemshabes-shabes-dyego-branch%5Cshabes-backend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cdyego%5CDocuments%5Caqtemshabes-shabes-dyego-branch%5Cshabes-backend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/profile/route.js":
/*!**********************************!*\
  !*** ./app/api/profile/route.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\n\n// Crie um cliente Supabase aqui usando as chaves de ambiente do backend.\n// Esta é a forma mais segura de interagir com o Supabase no lado do servidor.\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(\"https://edrejwzrffbppqhajjno.supabase.co\", process.env.SUPABASE_SERVICE_KEY);\nasync function GET(request) {\n    try {\n        // 1. Pega o token do cabeçalho da requisição, enviado pelo app\n        const authHeader = request.headers.get(\"Authorization\");\n        const jwt = authHeader?.split(\"Bearer \")[1];\n        if (!jwt) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Token de autoriza\\xe7\\xe3o n\\xe3o encontrado\"\n            }, {\n                status: 401\n            });\n        }\n        // 2. Valida o token e pega os dados do usuário\n        const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);\n        if (userError || !user) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Token inv\\xe1lido ou expirado\"\n            }, {\n                status: 401\n            });\n        }\n        // 3. Com o usuário validado, busca o perfil correspondente na tabela 'profiles'\n        const { data: profile, error: profileError } = await supabase.from(\"profiles\").select(\"*\").eq(\"id\", user.id).single();\n        if (profileError) {\n            // Se houver um erro na busca do perfil, retorna erro 500\n            throw new Error(profileError.message);\n        }\n        // 4. Se tudo deu certo, retorna os dados do perfil\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(profile);\n    } catch (error) {\n        console.error(\"Erro no servidor:\", error);\n        // Retorna uma mensagem de erro genérica para o cliente\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Erro interno no servidor\"\n        }, {\n            status: 500\n        });\n    }\n} // A função PATCH para atualizar também pode ser simplificada da mesma forma no futuro.\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3Byb2ZpbGUvcm91dGUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQXFEO0FBQ1Y7QUFFM0MseUVBQXlFO0FBQ3pFLDhFQUE4RTtBQUM5RSxNQUFNRSxXQUFXRixtRUFBWUEsQ0FDM0JHLDBDQUFvQyxFQUNwQ0EsUUFBUUMsR0FBRyxDQUFDRSxvQkFBb0I7QUFHM0IsZUFBZUMsSUFBSUMsT0FBTztJQUMvQixJQUFJO1FBQ0YsK0RBQStEO1FBQy9ELE1BQU1DLGFBQWFELFFBQVFFLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDO1FBQ3ZDLE1BQU1DLE1BQU1ILFlBQVlJLE1BQU0sVUFBVSxDQUFDLEVBQUU7UUFFM0MsSUFBSSxDQUFDRCxLQUFLO1lBQ1IsT0FBT1gscURBQVlBLENBQUNhLElBQUksQ0FBQztnQkFBRUMsT0FBTztZQUFzQyxHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDM0Y7UUFFQSwrQ0FBK0M7UUFDL0MsTUFBTSxFQUFFQyxNQUFNLEVBQUVDLElBQUksRUFBRSxFQUFFSCxPQUFPSSxTQUFTLEVBQUUsR0FBRyxNQUFNakIsU0FBU2tCLElBQUksQ0FBQ0MsT0FBTyxDQUFDVDtRQUV6RSxJQUFJTyxhQUFhLENBQUNELE1BQU07WUFDdEIsT0FBT2pCLHFEQUFZQSxDQUFDYSxJQUFJLENBQUM7Z0JBQUVDLE9BQU87WUFBNkIsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ2xGO1FBRUEsZ0ZBQWdGO1FBQ2hGLE1BQU0sRUFBRUMsTUFBTUssT0FBTyxFQUFFUCxPQUFPUSxZQUFZLEVBQUUsR0FBRyxNQUFNckIsU0FDbERzQixJQUFJLENBQUMsWUFDTEMsTUFBTSxDQUFDLEtBQ1BDLEVBQUUsQ0FBQyxNQUFNUixLQUFLUyxFQUFFLEVBQ2hCQyxNQUFNO1FBRVQsSUFBSUwsY0FBYztZQUNoQix5REFBeUQ7WUFDekQsTUFBTSxJQUFJTSxNQUFNTixhQUFhTyxPQUFPO1FBQ3RDO1FBRUEsbURBQW1EO1FBQ25ELE9BQU83QixxREFBWUEsQ0FBQ2EsSUFBSSxDQUFDUTtJQUUzQixFQUFFLE9BQU9QLE9BQU87UUFDZGdCLFFBQVFoQixLQUFLLENBQUMscUJBQXFCQTtRQUNuQyx1REFBdUQ7UUFDdkQsT0FBT2QscURBQVlBLENBQUNhLElBQUksQ0FBQztZQUFFQyxPQUFPO1FBQTJCLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQ2hGO0FBQ0YsRUFFQSx1RkFBdUYiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9zaGFiZXMtYmFja2VuZC1hcGkvLi9hcHAvYXBpL3Byb2ZpbGUvcm91dGUuanM/MTBhOSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnO1xuaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInO1xuXG4vLyBDcmllIHVtIGNsaWVudGUgU3VwYWJhc2UgYXF1aSB1c2FuZG8gYXMgY2hhdmVzIGRlIGFtYmllbnRlIGRvIGJhY2tlbmQuXG4vLyBFc3RhIMOpIGEgZm9ybWEgbWFpcyBzZWd1cmEgZGUgaW50ZXJhZ2lyIGNvbSBvIFN1cGFiYXNlIG5vIGxhZG8gZG8gc2Vydmlkb3IuXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcbiAgcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMLFxuICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX0tFWVxuKTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgLy8gMS4gUGVnYSBvIHRva2VuIGRvIGNhYmXDp2FsaG8gZGEgcmVxdWlzacOnw6NvLCBlbnZpYWRvIHBlbG8gYXBwXG4gICAgY29uc3QgYXV0aEhlYWRlciA9IHJlcXVlc3QuaGVhZGVycy5nZXQoJ0F1dGhvcml6YXRpb24nKTtcbiAgICBjb25zdCBqd3QgPSBhdXRoSGVhZGVyPy5zcGxpdCgnQmVhcmVyICcpWzFdO1xuXG4gICAgaWYgKCFqd3QpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnVG9rZW4gZGUgYXV0b3JpemHDp8OjbyBuw6NvIGVuY29udHJhZG8nIH0sIHsgc3RhdHVzOiA0MDEgfSk7XG4gICAgfVxuXG4gICAgLy8gMi4gVmFsaWRhIG8gdG9rZW4gZSBwZWdhIG9zIGRhZG9zIGRvIHVzdcOhcmlvXG4gICAgY29uc3QgeyBkYXRhOiB7IHVzZXIgfSwgZXJyb3I6IHVzZXJFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5nZXRVc2VyKGp3dCk7XG5cbiAgICBpZiAodXNlckVycm9yIHx8ICF1c2VyKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1Rva2VuIGludsOhbGlkbyBvdSBleHBpcmFkbycgfSwgeyBzdGF0dXM6IDQwMSB9KTtcbiAgICB9XG5cbiAgICAvLyAzLiBDb20gbyB1c3XDoXJpbyB2YWxpZGFkbywgYnVzY2EgbyBwZXJmaWwgY29ycmVzcG9uZGVudGUgbmEgdGFiZWxhICdwcm9maWxlcydcbiAgICBjb25zdCB7IGRhdGE6IHByb2ZpbGUsIGVycm9yOiBwcm9maWxlRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAuZnJvbSgncHJvZmlsZXMnKVxuICAgICAgLnNlbGVjdCgnKicpXG4gICAgICAuZXEoJ2lkJywgdXNlci5pZClcbiAgICAgIC5zaW5nbGUoKTtcblxuICAgIGlmIChwcm9maWxlRXJyb3IpIHtcbiAgICAgIC8vIFNlIGhvdXZlciB1bSBlcnJvIG5hIGJ1c2NhIGRvIHBlcmZpbCwgcmV0b3JuYSBlcnJvIDUwMFxuICAgICAgdGhyb3cgbmV3IEVycm9yKHByb2ZpbGVFcnJvci5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICAvLyA0LiBTZSB0dWRvIGRldSBjZXJ0bywgcmV0b3JuYSBvcyBkYWRvcyBkbyBwZXJmaWxcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24ocHJvZmlsZSk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvIG5vIHNlcnZpZG9yOicsIGVycm9yKTtcbiAgICAvLyBSZXRvcm5hIHVtYSBtZW5zYWdlbSBkZSBlcnJvIGdlbsOpcmljYSBwYXJhIG8gY2xpZW50ZVxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnRXJybyBpbnRlcm5vIG5vIHNlcnZpZG9yJyB9LCB7IHN0YXR1czogNTAwIH0pO1xuICB9XG59XG5cbi8vIEEgZnVuw6fDo28gUEFUQ0ggcGFyYSBhdHVhbGl6YXIgdGFtYsOpbSBwb2RlIHNlciBzaW1wbGlmaWNhZGEgZGEgbWVzbWEgZm9ybWEgbm8gZnV0dXJvLiJdLCJuYW1lcyI6WyJjcmVhdGVDbGllbnQiLCJOZXh0UmVzcG9uc2UiLCJzdXBhYmFzZSIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJTVVBBQkFTRV9TRVJWSUNFX0tFWSIsIkdFVCIsInJlcXVlc3QiLCJhdXRoSGVhZGVyIiwiaGVhZGVycyIsImdldCIsImp3dCIsInNwbGl0IiwianNvbiIsImVycm9yIiwic3RhdHVzIiwiZGF0YSIsInVzZXIiLCJ1c2VyRXJyb3IiLCJhdXRoIiwiZ2V0VXNlciIsInByb2ZpbGUiLCJwcm9maWxlRXJyb3IiLCJmcm9tIiwic2VsZWN0IiwiZXEiLCJpZCIsInNpbmdsZSIsIkVycm9yIiwibWVzc2FnZSIsImNvbnNvbGUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/profile/route.js\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/next","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fprofile%2Froute&page=%2Fapi%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fprofile%2Froute.js&appDir=C%3A%5CUsers%5Cdyego%5CDocuments%5Caqtemshabes-shabes-dyego-branch%5Cshabes-backend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cdyego%5CDocuments%5Caqtemshabes-shabes-dyego-branch%5Cshabes-backend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();