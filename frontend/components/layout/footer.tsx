import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <span className="text-xs font-bold">M</span>
              </div>
              <span className="text-sm font-medium">MMN Explorer</span>
            </div>
            <Separator orientation="vertical" className="hidden h-4 md:block" />
            <p className="text-sm text-muted-foreground">
              © 2024 MMN Explorer. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
