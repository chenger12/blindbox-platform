import { NavItemId } from '../theme/theme.model';

export interface NavLink {
  id: NavItemId;
  route: string;
  labelKey: string;
  icon: string;
  exact: boolean;
}
