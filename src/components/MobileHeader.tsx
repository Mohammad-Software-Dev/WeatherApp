import LightDarkToggle from "./LightDarkToggle";

export default function MobileHeader() {
  return (
    <div className="w-full h-16 p-4 bg-background sticky top-0 xs:hidden flex gap-8 justify-end z-1001">
      <LightDarkToggle />
    </div>
  );
}
