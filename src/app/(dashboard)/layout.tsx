import TopNavBar from "@/components/layout/TopNavBar";
import SideNavBar from "@/components/layout/SideNavBar";
import Footer from "@/components/layout/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNavBar />
      <SideNavBar />
      <main className="ml-64 pt-20 px-8 pb-12 min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
