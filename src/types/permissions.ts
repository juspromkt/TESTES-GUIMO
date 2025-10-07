export interface UserPermissions {
  id_usuario: number;
  can_view_dashboard_crm: boolean;
  can_view_dashboard_prospeccao: boolean;
  can_view_menu_chat: boolean;
  can_view_menu_agent: boolean;
  can_view_menu_crm: boolean;
  can_view_menu_schedule: boolean;
  can_view_menu_prospect: boolean;
  can_view_menu_contacts: boolean;
  can_view_menu_connection: boolean;
  can_view_menu_settings: boolean;
  can_edit_agent: boolean;
  can_edit_crm: boolean;
  can_edit_schedule: boolean;
  can_edit_prospect: boolean;
  can_edit_contacts: boolean;
  can_edit_connection: boolean;
  can_edit_settings: boolean;
  can_view_all_leads: boolean;
  can_view_assigned_leads: boolean;
  can_view_prospeccao_busca: boolean;
  can_view_prospeccao_dd: boolean;
}