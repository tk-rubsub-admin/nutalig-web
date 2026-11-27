export function getEmployeeDisplayName(employee?: any): string {
  if (!employee) return '-';

  const nickname = employee.nickName || employee.nickname;
  const fullName = [
    employee.firstNameTh || employee.firstName,
    employee.lastNameTh || employee.lastName
  ].filter(Boolean).join(' ').trim();
  const name = nickname || employee.displayName || employee.name || fullName || employee.employeeId || '-';
  const team = employee.team;
  const teamName = typeof team === 'string'
    ? team
    : team?.nameTh || team?.nameEn || team?.code;

  return teamName ? `${name} (${teamName})` : name;
}
