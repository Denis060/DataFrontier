import { getChrome, menuFor } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/auth";
import { SiteHeader } from "@/components/home/site-header";
import { SiteFooter } from "@/components/home/site-footer";

/** Header + footer chrome for every page that isn't the homepage. */
export async function Shell({ children }: { children: React.ReactNode }) {
  const [{ settings, menus, ticker }, profile] = await Promise.all([
    getChrome(),
    getCurrentProfile(),
  ]);
  const siteName = settings?.site_name ?? "The DataFrontier";

  return (
    <>
      <SiteHeader
        siteName={siteName}
        established={settings?.established_year ?? null}
        nav={menuFor(menus, "header")}
        ticker={ticker}
        profile={profile}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        siteName={siteName}
        tagline={settings?.tagline ?? null}
        menus={menus}
        year={new Date().getFullYear()}
        editorName={null}
      />
    </>
  );
}
