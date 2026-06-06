import { Outlet } from "react-router-dom"
import { GridContainer } from "./grid-container"
import { PillNav } from "./pill-nav"

export default function AppShell() {
  return (
    <div className="dot-pattern min-h-screen">
      <div className="sticky top-0 z-50 wide:static wide:z-auto">
        <PillNav />
      </div>

      <GridContainer>
        <main className="col-span-12 wide:col-start-4 wide:col-span-9 pt-4 wide:pt-0">
          <Outlet />
        </main>
      </GridContainer>
    </div>
  )
}
