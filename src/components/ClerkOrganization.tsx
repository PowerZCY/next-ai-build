import { OrganizationSwitcher } from '@clerk/nextjs';
import { globalLucideIcons as icons } from '@/components/global-icon';
interface ClerkOrganizationProps {
  className?: string;
  locale: string;
}

export default function ClerkOrganization({
  locale,
  className = '',
}: ClerkOrganizationProps) {
  return (
    <div className={` ms-3 me-2 flex items-center h-10 rounded-full border shadow-lg ${className}`}>
      <div className="flex items-center gap-x-4 w-full min-w-40">
        <OrganizationSwitcher
          appearance={{
            elements: {
              organizationSwitcherTrigger:
                "w-40 h-10 border !rounded-full bg-transparent flex items-center justify-between box-border",
              organizationSwitcherTriggerIcon: "",
              userButtonAvatarBox: "w-8 h-8 border rounded-full",
            },
          }}
        >
          <OrganizationSwitcher.OrganizationProfilePage
            label="Homepage"
            url="/"
            labelIcon={<icons.D8 />}
          />
          <OrganizationSwitcher.OrganizationProfilePage 
            labelIcon={<icons.FileText />}
            label="服务"
            url={`/${locale}/legal/terms`}
          >
          </OrganizationSwitcher.OrganizationProfilePage>

          <OrganizationSwitcher.OrganizationProfilePage
            labelIcon={<icons.ShieldUser />}
            label="隐私"
            url={`/${locale}/legal/privacy`}
          >
          </OrganizationSwitcher.OrganizationProfilePage> 
        </OrganizationSwitcher>
      </div>
    </div>
  );
} 