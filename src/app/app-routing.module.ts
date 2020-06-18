import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: "home",
    loadChildren: () =>
      import("./home/home.module").then((m) => m.HomePageModule),
  },
  {
    path: "",
    redirectTo: "home",
    pathMatch: "full",
  },
  {
    path: "home",
    loadChildren: () =>
      import("./home/home.module").then((m) => m.HomePageModule),
  },
  {
    path: "targetlist",
    loadChildren: () =>
      import("./targetlist/targetlist.module").then(
        (m) => m.TargetlistPageModule
      ),
  },
  {
    path: "target/:id",
    loadChildren: () =>
      import("./target/target.module").then((m) => m.TargetPageModule),
  },
  {
    path: "test",
    loadChildren: () =>
      import("./test/test.module").then((m) => m.TestPageModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
