export type GameFriend = {
  id: string;
  name: string;
  avatar: string;
  status: 'ONLINE' | 'PLAYING' | 'AWAY' | 'OFFLINE';
  detail: string;
  score: number;
};

export type RecentMatch = {
  id: string;
  opponent: string;
  avatar: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  score: string;
  ratingChange: number;
  playedAt: string;
  mode: 'RANKED' | 'FRIENDLY';
};

export const gameProfile = {
  playerId: '102938',
  score: 1257,
  peakScore: 1487,
  rank: 'Kỳ Thủ Tài Năng',
  rankShort: 'Kim Cương III',
  hearts: 5,
  totalMatches: 562,
  wins: 326,
  losses: 186,
  draws: 50,
  winRate: 58,
  currentStreak: 5,
  longestStreak: 12,
  rankedMatches: 318,
  friendlyMatches: 244,
};

export const gameFriends: GameFriend[] = [
  {
    id: 'friend-meo-u',
    name: 'Mèo Ú',
    avatar: '👧🏻',
    status: 'PLAYING',
    detail: 'Đang chơi Cờ Caro',
    score: 1342,
  },
  {
    id: 'friend-nam-anh',
    name: 'Nam Anh',
    avatar: '👨🏻‍💻',
    status: 'ONLINE',
    detail: 'Đang rảnh',
    score: 1231,
  },
  {
    id: 'friend-sunny-day',
    name: 'Sunny Day',
    avatar: '👩🏻',
    status: 'ONLINE',
    detail: 'Online',
    score: 1198,
  },
  {
    id: 'friend-tran-minh',
    name: 'Trần Minh',
    avatar: '🧑🏻',
    status: 'PLAYING',
    detail: 'Đang trong trận',
    score: 1404,
  },
  {
    id: 'friend-bao-long',
    name: 'Bảo Long',
    avatar: '👦🏻',
    status: 'AWAY',
    detail: '5 phút trước',
    score: 1087,
  },
  {
    id: 'friend-linh-dan',
    name: 'Linh Đan',
    avatar: '👩🏻‍🎨',
    status: 'OFFLINE',
    detail: '12 phút trước',
    score: 997,
  },
];

export const recentMatches: RecentMatch[] = [
  {
    id: 'HX-2401',
    opponent: 'Mèo Ú',
    avatar: '👧🏻',
    result: 'WIN',
    score: '2 - 0',
    ratingChange: 24,
    playedAt: '5 phút trước',
    mode: 'RANKED',
  },
  {
    id: 'HX-2402',
    opponent: 'Nam Anh',
    avatar: '👨🏻‍💻',
    result: 'LOSS',
    score: '0 - 2',
    ratingChange: -16,
    playedAt: '22 phút trước',
    mode: 'RANKED',
  },
  {
    id: 'HX-2403',
    opponent: 'Sunny Day',
    avatar: '👩🏻',
    result: 'WIN',
    score: '2 - 1',
    ratingChange: 18,
    playedAt: '1 giờ trước',
    mode: 'RANKED',
  },
  {
    id: 'HX-2404',
    opponent: 'Trần Minh',
    avatar: '🧑🏻',
    result: 'DRAW',
    score: '1 - 1',
    ratingChange: 0,
    playedAt: 'Hôm qua',
    mode: 'FRIENDLY',
  },
];

export const leaderboard = [
  { rank: 1, name: 'Minh Khang', avatar: '🧑🏻‍🚀', tier: 'Cao Thủ', score: 1812 },
  { rank: 2, name: 'Quang Huy', avatar: '👦🏻', tier: 'Cao Thủ', score: 1734 },
  { rank: 3, name: 'Bảo Long', avatar: '👨🏻‍🎓', tier: 'Cao Thủ', score: 1685 },
  { rank: 4, name: 'Hoàng Duy', avatar: '🧑🏻', tier: 'Kim Cương I', score: 1542 },
  { rank: 5, name: 'Thùy Linh', avatar: '👩🏻', tier: 'Kim Cương II', score: 1498 },
  { rank: 12, name: 'Heo Xinh', avatar: '🐷', tier: 'Kim Cương III', score: 1257 },
];

export const rankTiers = [
  { name: 'Nhập Môn', range: '0 – 199', icon: '⬡' },
  { name: 'Tập Sự', range: '200 – 399', icon: '⬢' },
  { name: 'Kỳ Thủ', range: '400 – 799', icon: '✦' },
  { name: 'Cao Thủ', range: '800 – 1.199', icon: '◆' },
  { name: 'Danh Thủ', range: '1.200 – 1.599', icon: '♛' },
  { name: 'Đại Sư', range: '1.600 – 1.999', icon: '✺' },
  { name: 'Kỳ Vương', range: '2.000+', icon: '♕' },
];

export function formatGameScore(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}
