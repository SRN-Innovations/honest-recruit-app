import MainHeader from "@/components/layout/MainHeader";
import MainFooter from "@/components/layout/MainFooter";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader />

      <main className="flex-grow pt-16">{/* Contact page content */}</main>

      <MainFooter />
    </div>
  );
}
