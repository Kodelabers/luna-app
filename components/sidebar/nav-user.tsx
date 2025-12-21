"use client";

import { useTransition } from "react";
import { ChevronsUpDown, LogOut, Languages, Check, Sun, Moon, Monitor, Palette } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { setLocale } from "@/lib/actions/locale";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useColorTheme, colorThemes, type ColorTheme } from "@/hooks/use-color-theme";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { signOut } = useClerk();
  const locale = useLocale();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(async () => {
      await setLocale(newLocale);
    });
  };

  const getColorPreview = (color: ColorTheme): string => {
    const colors: Record<ColorTheme, string> = {
      zinc: "#71717a",
      blue: "#3b82f6",
      green: "#22c55e",
      orange: "#f97316",
      red: "#ef4444",
      violet: "#8b5cf6",
      yellow: "#eab308",
    };
    return colors[color];
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={isPending}>
                <Languages className="mr-2 size-4" />
                {t("language.select")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {locales.map((l) => (
                  <DropdownMenuItem
                    key={l}
                    onClick={() => handleLocaleChange(l)}
                    disabled={isPending}
                  >
                    {locale === l && <Check className="mr-2 size-4" />}
                    <span className={locale !== l ? "ml-6" : ""}>
                      {localeNames[l]}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="mr-2 size-4 dark:hidden" />
                <Moon className="mr-2 size-4 hidden dark:block" />
                {t("theme.mode")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  {theme === "light" && <Check className="mr-2 size-4" />}
                  <Sun className={theme !== "light" ? "ml-6 mr-2 size-4" : "mr-2 size-4"} />
                  {t("theme.light")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  {theme === "dark" && <Check className="mr-2 size-4" />}
                  <Moon className={theme !== "dark" ? "ml-6 mr-2 size-4" : "mr-2 size-4"} />
                  {t("theme.dark")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  {theme === "system" && <Check className="mr-2 size-4" />}
                  <Monitor className={theme !== "system" ? "ml-6 mr-2 size-4" : "mr-2 size-4"} />
                  {t("theme.system")}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Palette className="mr-2 size-4" />
                {t("theme.color")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {colorThemes.map((color) => (
                  <DropdownMenuItem
                    key={color}
                    onClick={() => setColorTheme(color)}
                  >
                    {colorTheme === color && <Check className="mr-2 size-4" />}
                    <div
                      className={`${colorTheme !== color ? "ml-6" : ""} mr-2 size-4 rounded-full`}
                      style={{ backgroundColor: getColorPreview(color) }}
                    />
                    {t(`theme.${color}`)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
              <LogOut className="mr-2 size-4" />
              {t("auth.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

