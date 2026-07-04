// The inline head script in app.vue applies the .dark class before hydration;
// this composable keeps a reactive mirror of it for the toggle button.
export function useTheme() {
  const isDark = useState("theme-dark", () => false);

  function sync() {
    isDark.value = document.documentElement.classList.contains("dark");
  }

  function toggle() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle("dark", isDark.value);
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  }

  return { isDark, sync, toggle };
}
