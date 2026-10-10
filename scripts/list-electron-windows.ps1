Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  using System.Collections.Generic;
  using System.Text;

  public class WinEnum {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static List<string> GetWindowsForProcess(uint pid) {
      var list = new List<string>();
      EnumWindows((hWnd, lParam) => {
        uint p;
        GetWindowThreadProcessId(hWnd, out p);
        if (p == pid) {
          var sb = new StringBuilder(256);
          GetWindowText(hWnd, sb, 256);
          bool vis = IsWindowVisible(hWnd);
          list.Add(string.Format("hWnd={0:X} Vis={1} Title='{2}'", hWnd.ToInt64(), vis, sb.ToString()));
        }
        return true;
      }, IntPtr.Zero);
      return list;
    }
  }
"@

$procs = Get-Process -Name electron, HushLoop -ErrorAction SilentlyContinue
foreach ($p in $procs) {
  $wins = [WinEnum]::GetWindowsForProcess($p.Id)
  Write-Output "PID $($p.Id) ($($p.ProcessName)): count=$($wins.Count)"
  foreach ($w in $wins) {
    Write-Output "  $w"
  }
}
