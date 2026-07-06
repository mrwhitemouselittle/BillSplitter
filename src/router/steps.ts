export interface BillStep {
  path: string;
  index: number;
  title: string;
  caption: string;
}

export const billSteps: BillStep[] = [
  { path: '/setup', index: 1, title: '账单信息', caption: '设置标题、时间和备注' },
  { path: '/participants', index: 2, title: '参与人', caption: '录入成员和已付金额' },
  { path: '/items', index: 3, title: '款项', caption: '添加全体或部分消费' },
  { path: '/adjustments', index: 4, title: '优惠费用', caption: '录入优惠和附加费用' },
  { path: '/review', index: 5, title: '结算收据', caption: '查看结果并导出 PDF' },
];

export function getStepByPath(pathname: string) {
  return billSteps.find((step) => step.path === pathname) ?? billSteps[0];
}

export function getNextStep(pathname: string) {
  const currentIndex = billSteps.findIndex((step) => step.path === pathname);
  return currentIndex >= 0 ? billSteps[currentIndex + 1] ?? null : null;
}

export function getPreviousStep(pathname: string) {
  const currentIndex = billSteps.findIndex((step) => step.path === pathname);
  return currentIndex >= 0 ? billSteps[currentIndex - 1] ?? null : null;
}
