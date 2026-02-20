import { Database, Flag, Home, LogOut, ScrollText, Sparkles, Users } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/src/admin/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/admin/components/ui/card";

type OperationsCardsProps = {
  isAdmin: boolean;
  importing: boolean;
  onImportFakeData: () => void;
  onLogout: () => void;
};

export function OperationsCards({
  isAdmin,
  importing,
  onImportFakeData,
  onLogout,
}: OperationsCardsProps) {
  return (
    <>
      {isAdmin ? (
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-brand" />
              Admin Tools
            </CardTitle>
            <CardDescription>Operational tools for demo and QA workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm text-muted-foreground">
              Import sample categories and content data.
            </div>
            <Button
              onClick={onImportFakeData}
              disabled={importing}
              variant="outline"
              className="w-full"
            >
              {importing ? "Importing fake data..." : "Import Fake Data"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Jump to dedicated admin pages for each task.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <Button asChild variant="outline" className="justify-start">
            <Link to="/">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link to="/moderation">
              <Flag className="h-4 w-4" />
              Moderation
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link to="/users">
              <Users className="h-4 w-4" />
              Users
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link to="/stories">
              <ScrollText className="h-4 w-4" />
              Stories
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link to="/poems">
              <Sparkles className="h-4 w-4" />
              Poems
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link to="/series">
              <Sparkles className="h-4 w-4" />
              Series
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-brand" />
            Session
          </CardTitle>
          <CardDescription>Sign out from this admin device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full" onClick={onLogout}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
