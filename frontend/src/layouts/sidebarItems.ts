interface SidebarItem {
  path: string
  label: string
  icon: string
}

export const sidebarItems: SidebarItem[] = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/lotes', label: 'Lotes', icon: '🐔' },
  { path: '/pesajes', label: 'Pesajes', icon: '⚖️' },
  { path: '/presupuesto-pesos', label: 'Presupuesto Pesos', icon: '📏' },
  { path: '/mortalidad', label: 'Mortalidad', icon: '☠️' },
  { path: '/alimentacion', label: 'Alimentación', icon: '🍽️' },
  { path: '/inventario', label: 'Inventario', icon: '📦' },
  { path: '/costos', label: 'Costos', icon: '💰' },
  { path: '/ambiente', label: 'Ambiente', icon: '🌡️' },
  { path: '/tercerizacion', label: 'Tercerización', icon: '🔄' },
  { path: '/procesamiento', label: 'Procesamiento', icon: '🏭' },
  { path: '/reportes', label: 'Reportes', icon: '📈' },
  { path: '/odoo', label: 'Integración Odoo', icon: '🔗' },
  { path: '/configuracion', label: 'Configuración', icon: '⚙️' },
]
