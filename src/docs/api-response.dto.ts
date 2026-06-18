import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AccountType,
  ActivitySource,
  ActivityStatus,
  PointsSource,
  ReferralStatus,
  RewardStatus,
  RewardType,
  RimType,
  Roles,
  SealingType,
  TerrainType,
  TireFitting,
  TirePerformanceProfile,
  TireUsageType,
} from '../generated/prisma/client';

export class MessageResponseDto {
  @ApiProperty({ example: 'Hello World!' })
  message!: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 401 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Unauthorized',
  })
  message!: string | string[];

  @ApiPropertyOptional({ example: 'Unauthorized' })
  error?: string;
}

export class AuthTokenResponseDto {
  @ApiProperty({
    description: 'JWT a transmettre dans Authorization: Bearer <token>.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;
}

export class StravaAuthorizationResponseDto {
  @ApiProperty({
    description: 'URL Strava OAuth vers laquelle rediriger l utilisateur.',
    example:
      'https://www.strava.com/oauth/authorize?client_id=123&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fstrava%2Fcallback&response_type=code&approval_prompt=auto&scope=read%2Cactivity%3Aread_all&state=uuid',
  })
  authorizationUrl!: string;
}

export class SafeUserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ nullable: true, example: 'Camille' })
  firstName!: string | null;

  @ApiProperty({ nullable: true, example: 'Martin' })
  lastName!: string | null;

  @ApiProperty({ example: 'camille@example.com' })
  mail!: string;

  @ApiProperty({ enum: Roles, isArray: true, example: [Roles.USER] })
  roles!: Roles[];

  @ApiProperty({ enum: AccountType, example: AccountType.STANDARD })
  accountType!: AccountType;

  @ApiProperty({ example: 120 })
  points!: number;

  @ApiProperty({ example: 'BRONZE' })
  currentTier!: string;

  @ApiProperty({ nullable: true, example: 'RIDE-A1B2C3' })
  referralCode!: string | null;
}

export class CurrentUserProfileResponseDto extends SafeUserResponseDto {
  @ApiProperty({
    description: 'Indique si un compte Strava est lie au profil courant.',
    example: true,
  })
  stravaLinked!: boolean;
}

export class RetailResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Michelin Store Paris' })
  name!: string;

  @ApiProperty({ example: '10 rue de Rivoli, 75004 Paris' })
  address!: string;

  @ApiProperty({ nullable: true, example: 2.3522 })
  longitude!: number | null;

  @ApiProperty({ nullable: true, example: 48.8566 })
  latitude!: number | null;

  @ApiProperty({ nullable: true, example: '+33123456789' })
  phoneNumber!: string | null;

  @ApiProperty({ nullable: true, example: 'https://example.com' })
  websiteUrl!: string | null;
}

export class ActivityTireLinkResponseDto {
  @ApiProperty({ example: 12 })
  tireId!: number;

  @ApiProperty({ example: 44 })
  activityId!: number;
}

export class ActivityBaseResponseDto {
  @ApiProperty({ example: 44 })
  id!: number;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ nullable: true, example: '1234567890' })
  stravaActivityId!: string | null;

  @ApiProperty({ nullable: true, example: 'Sortie gravel du matin' })
  name!: string | null;

  @ApiProperty({ enum: ActivitySource, example: ActivitySource.APP_TRACKED })
  source!: ActivitySource;

  @ApiProperty({ enum: ActivityStatus, example: ActivityStatus.IN_PROGRESS })
  status!: ActivityStatus;

  @ApiProperty({ nullable: true, example: null })
  startPosition!: number | null;

  @ApiProperty({ nullable: true, example: 18.4 })
  kilometers!: number | null;

  @ApiProperty({ nullable: true, example: 4020 })
  durationSeconds!: number | null;

  @ApiProperty({ enum: TerrainType, example: TerrainType.GRAVEL })
  terrainType!: TerrainType;

  @ApiProperty({ nullable: true, format: 'date-time' })
  startedAt!: string | null;

  @ApiProperty({ nullable: true, format: 'date-time' })
  endedAt!: string | null;

  @ApiProperty({ nullable: true, format: 'date-time' })
  date!: string | null;

  @ApiProperty({ example: 18.4 })
  rewardedKilometers!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

}

export class ActivityResponseDto extends ActivityBaseResponseDto {
  @ApiProperty({ type: () => [ActivityTireLinkResponseDto] })
  tires!: ActivityTireLinkResponseDto[];
}

export class ActivityTireSummaryResponseDto {
  @ApiProperty({ example: 12 })
  userTireId!: number;

  @ApiProperty({ example: 'MICHELIN Power Adventure' })
  name!: string;

  @ApiProperty({ nullable: true, example: 'front' })
  position!: string | null;
}

export class ActivityDetailResponseDto extends ActivityBaseResponseDto {
  @ApiProperty({ type: () => [ActivityTireSummaryResponseDto] })
  tires!: ActivityTireSummaryResponseDto[];
}

export class TerrainTypeResponseDto {
  @ApiProperty({ enum: TerrainType, example: TerrainType.GRAVEL })
  value!: TerrainType;

  @ApiProperty({ example: 'Gravel' })
  label!: string;
}

export class ActivityGpsPointResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 44 })
  activityId!: number;

  @ApiProperty({ example: 48.8566 })
  latitude!: number;

  @ApiProperty({ example: 2.3522 })
  longitude!: number;

  @ApiProperty({ nullable: true, example: 5 })
  accuracy!: number | null;

  @ApiProperty({ nullable: true, example: 35 })
  altitude!: number | null;

  @ApiProperty({ nullable: true, example: 7.8 })
  speed!: number | null;

  @ApiProperty({ format: 'date-time' })
  recordedAt!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class DeletedResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}

export class TireWearScoreDetailsResponseDto {
  @ApiProperty({ example: 735 })
  mileageKm!: number;

  @ApiProperty({ example: 15 })
  mileagePenalty!: number;

  @ApiProperty({ example: 1 })
  underInflatedCount!: number;

  @ApiProperty({ example: 5 })
  underInflationPenalty!: number;

  @ApiProperty({ example: 0 })
  usagePenalty!: number;
}

export class UserTireSummaryResponseDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ nullable: true, example: 'front' })
  position!: string | null;

  @ApiProperty({ nullable: true, example: 735 })
  kilometers!: number | null;

  @ApiProperty({ nullable: true, example: true })
  smartTire!: boolean | null;

  @ApiProperty({ nullable: true, example: true })
  isActive!: boolean | null;

  @ApiProperty({ example: 'MICHELIN Power Adventure' })
  model!: string;

  @ApiProperty({ nullable: true, example: 'https://example.com/tire.png' })
  tireImage!: string | null;

  @ApiProperty({ example: 80 })
  health!: number;

  @ApiProperty({ example: 80 })
  healthScore!: number;

  @ApiProperty({ enum: ['good', 'warning', 'replace_soon'], example: 'good' })
  healthStatus!: 'good' | 'warning' | 'replace_soon';

  @ApiProperty({ type: () => TireWearScoreDetailsResponseDto })
  healthDetails!: TireWearScoreDetailsResponseDto;

  @ApiProperty({ nullable: true, enum: ['REPLACE_SOON'], example: null })
  healthAlertType!: 'REPLACE_SOON' | null;
}

export class UserTireInfoResponseDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ nullable: true, example: 735 })
  kilometers!: number | null;

  @ApiProperty({ nullable: true, example: 2.4 })
  lastPressureBar!: number | null;

  @ApiProperty({ nullable: true, example: true })
  smartTire!: boolean | null;

  @ApiProperty({ example: 'MICHELIN Power Adventure' })
  model!: string;

  @ApiProperty({ nullable: true, example: 'https://example.com/tire.png' })
  tireImage!: string | null;
}

export class UserTireWearResponseDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'MICHELIN Power Adventure' })
  model!: string;

  @ApiProperty({ nullable: true, example: 'https://example.com/tire.png' })
  tireImage!: string | null;

  @ApiProperty({ nullable: true, example: 'front' })
  position!: string | null;

  @ApiProperty({ example: 80 })
  healthScore!: number;

  @ApiProperty({ enum: ['good', 'warning', 'replace_soon'], example: 'good' })
  healthStatus!: 'good' | 'warning' | 'replace_soon';
}

export class UserTireActiveResponseDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

export class TireCatalogItemResponseDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'MICHELIN Power Cup' })
  name!: string;

  @ApiProperty({ nullable: true, example: 'https://example.com/tire.png' })
  tireImage!: string | null;
}

export class TireDetailResponseDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'MICHELIN Power Adventure' })
  model!: string;

  @ApiProperty({ enum: TerrainType, isArray: true, example: [TerrainType.GRAVEL] })
  terrainTypes!: TerrainType[];

  @ApiProperty({ nullable: true, enum: TireUsageType, example: TireUsageType.GRAVEL })
  usageType!: TireUsageType | null;

  @ApiProperty({ nullable: true, example: '700' })
  wheelDiameter!: string | null;

  @ApiProperty({ nullable: true, example: 622 })
  etrtoDiameter!: number | null;

  @ApiProperty({ nullable: true, example: 36 })
  etrtoWidth!: number | null;

  @ApiProperty({ nullable: true, enum: RimType, example: RimType.TUBELESS })
  rimType!: RimType | null;

  @ApiProperty({
    nullable: true,
    enum: SealingType,
    example: SealingType.TUBELESS_READY,
  })
  sealingType!: SealingType | null;

  @ApiProperty({ nullable: true, enum: TireFitting, example: TireFitting.FRONT_REAR })
  fitting!: TireFitting | null;

  @ApiProperty({ example: true })
  eBikeCompatible!: boolean;

  @ApiProperty({
    enum: TirePerformanceProfile,
    isArray: true,
    example: [TirePerformanceProfile.GRIP, TirePerformanceProfile.DURABILITY],
  })
  performanceProfiles!: TirePerformanceProfile[];

  @ApiProperty({ nullable: true, example: 'Power' })
  familyName!: string | null;

  @ApiProperty({ nullable: true, example: 'Adventure' })
  productRange!: string | null;

  @ApiProperty({ nullable: true, example: 'https://example.com/tire.png' })
  tireImage!: string | null;

  @ApiProperty({ example: 2.2 })
  minPressure!: number;

  @ApiProperty({ example: 5 })
  maxPressure!: number;

  @ApiProperty({ example: 3000 })
  maxKilometers!: number;
}

export class TireDealerResponseDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: 'Michelin Store Paris' })
  name!: string;

  @ApiProperty({ example: '10 rue de Rivoli, 75004 Paris' })
  address!: string;

  @ApiProperty({ example: '+33123456789' })
  phone!: string;

  @ApiProperty({ example: 48.8566 })
  latitude!: number;

  @ApiProperty({ example: 2.3522 })
  longitude!: number;
}

export class TireSensorAnalysisResponseDto {
  @ApiProperty({ example: 'sensor-front-001' })
  deviceId!: string;

  @ApiProperty({ example: 12 })
  userTireId!: number;

  @ApiProperty({ example: 'MICHELIN Power Adventure' })
  tireProductName!: string;

  @ApiProperty({ example: 2.4 })
  pressureBar!: number;

  @ApiProperty({ example: 21.5 })
  temperatureC!: number;

  @ApiProperty({ format: 'date-time' })
  measuredAt!: string;

  @ApiProperty({ enum: ['good', 'warning', 'critical'], example: 'good' })
  status!: 'good' | 'warning' | 'critical';

  @ApiProperty({ enum: ['good', 'warning', 'critical'], example: 'good' })
  pressureStatus!: 'good' | 'warning' | 'critical';

  @ApiProperty({
    nullable: true,
    enum: [
      'PRESSURE_TOO_LOW',
      'PRESSURE_TOO_HIGH',
      'ABNORMAL_PRESSURE_DROP',
      'SLOW_LEAK_SUSPECTED',
    ],
    example: null,
  })
  alertType!: string | null;

  @ApiProperty({ nullable: true, enum: ['warning', 'critical'], example: null })
  severity!: 'warning' | 'critical' | null;

  @ApiProperty({ example: 'Pression conforme aux recommandations Michelin.' })
  message!: string;

  @ApiProperty({ example: 'Continuer le suivi.' })
  recommendedAction!: string;

  @ApiProperty({ example: false })
  alertCreated!: boolean;

  @ApiProperty({ example: false })
  pressureAlertCreated!: boolean;
}

export class TireWearEvaluationResponseDto {
  @ApiProperty({ example: 12 })
  userTireId!: number;

  @ApiProperty({ example: 'MICHELIN Power Adventure' })
  tireProductName!: string;

  @ApiProperty({ example: 80 })
  healthScore!: number;

  @ApiProperty({ enum: ['good', 'warning', 'replace_soon'], example: 'good' })
  healthStatus!: 'good' | 'warning' | 'replace_soon';

  @ApiProperty({ type: () => TireWearScoreDetailsResponseDto })
  healthDetails!: TireWearScoreDetailsResponseDto;

  @ApiProperty({ nullable: true, enum: ['REPLACE_SOON'], example: null })
  alertType!: 'REPLACE_SOON' | null;

  @ApiProperty({ example: false })
  alertCreated!: boolean;

  @ApiProperty({ example: false })
  alertCleared!: boolean;
}

export class RecommendedTireSummaryResponseDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'MICHELIN Power Adventure' })
  model!: string;

  @ApiProperty({ example: 'Compatible avec votre pratique gravel.' })
  reason!: string;

  @ApiProperty({ example: false })
  isFallback!: boolean;
}

export class AlertMetadataResponseDto {
  @ApiPropertyOptional({ type: () => [RecommendedTireSummaryResponseDto] })
  recommendedTires?: RecommendedTireSummaryResponseDto[];

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      lastCheckedReadingCount: { type: 'number', example: 6 },
    },
  })
  slowLeak?: { lastCheckedReadingCount?: number };

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      healthScore: { type: 'number', example: 35 },
      healthStatus: { type: 'string', example: 'replace_soon' },
      mileageKm: { type: 'number', example: 1800 },
      mileagePenalty: { type: 'number', example: 50 },
      underInflatedCount: { type: 'number', example: 2 },
      underInflationPenalty: { type: 'number', example: 10 },
      usagePenalty: { type: 'number', example: 0 },
      tireProductName: { type: 'string', example: 'MICHELIN Power Adventure' },
    },
  })
  tireHealth?: Record<string, unknown>;
}

export class AlertResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 12 })
  userTireId!: number;

  @ApiProperty({ example: 'PRESSURE_TOO_LOW' })
  code!: string;

  @ApiProperty({
    example:
      'Pression trop basse - La pression du pneu est inferieure a la recommandation Michelin.',
  })
  message!: string;

  @ApiProperty({ example: false })
  isChecked!: boolean;

  @ApiProperty({ nullable: true, type: () => AlertMetadataResponseDto })
  metadata!: AlertMetadataResponseDto | null;
}

export class RewardResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ enum: RewardType, example: RewardType.DISCOUNT_VOUCHER })
  type!: RewardType;

  @ApiProperty({ example: 'TIER-A1B2C3D4' })
  code!: string;

  @ApiProperty({ enum: PointsSource, example: PointsSource.TIER })
  source!: PointsSource;

  @ApiProperty({ enum: RewardStatus, example: RewardStatus.AVAILABLE })
  status!: RewardStatus;

  @ApiProperty({ nullable: true, example: 15 })
  discountPercent!: number | null;

  @ApiProperty({ nullable: true, example: 'accessoires' })
  category!: string | null;

  @ApiProperty({ nullable: true, example: 25 })
  amount!: number | null;

  @ApiProperty({ nullable: true, example: 'tier:1:SILVER' })
  reference!: string | null;

  @ApiProperty({ nullable: true, format: 'date-time' })
  expiresAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class ReferralUserSummaryResponseDto {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ nullable: true, example: 'Nina' })
  firstName!: string | null;

  @ApiProperty({ nullable: true, example: 'Leroy' })
  lastName!: string | null;

  @ApiProperty({ example: 'nina@example.com' })
  mail!: string;
}

export class ReferralItemResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: ReferralStatus, example: ReferralStatus.REGISTERED })
  status!: ReferralStatus;

  @ApiProperty({ nullable: true, format: 'date-time' })
  completedAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: () => ReferralUserSummaryResponseDto })
  filleul!: ReferralUserSummaryResponseDto;
}

export class ReferralOverviewResponseDto {
  @ApiProperty({ example: 'RIDE-A1B2C3' })
  referralCode!: string;

  @ApiProperty({ example: 'http://localhost:5173/register?ref=RIDE-A1B2C3' })
  referralLink!: string;

  @ApiProperty({ example: 4 })
  totalReferrals!: number;

  @ApiProperty({ example: 2 })
  completedReferrals!: number;

  @ApiProperty({ type: () => [ReferralItemResponseDto] })
  referrals!: ReferralItemResponseDto[];
}

export class ReferralValidationResponseDto {
  @ApiProperty({ example: true })
  valid!: boolean;
}

export class InfluencerReferralStatsResponseDto {
  @ApiProperty({ example: 10 })
  total!: number;

  @ApiProperty({ example: 6 })
  converted!: number;

  @ApiProperty({ example: 60 })
  conversionRate!: number;
}

export class InfluencerCommissionStatsResponseDto {
  @ApiProperty({ example: 50 })
  pendingAmount!: number;

  @ApiProperty({ example: 100 })
  paidAmount!: number;

  @ApiProperty({ example: 150 })
  totalAmount!: number;

  @ApiProperty({ type: () => [RewardResponseDto] })
  items!: RewardResponseDto[];
}

export class InfluencerDashboardResponseDto {
  @ApiProperty({ type: () => InfluencerReferralStatsResponseDto })
  referrals!: InfluencerReferralStatsResponseDto;

  @ApiProperty({ type: () => InfluencerCommissionStatsResponseDto })
  commissions!: InfluencerCommissionStatsResponseDto;
}

export class AiRecommendedTireResponseDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'MICHELIN Power Adventure' })
  model!: string;

  @ApiProperty({
    example: 'Ce pneu correspond a une pratique gravel avec recherche de grip.',
  })
  reason!: string;

  @ApiProperty({ enum: TerrainType, isArray: true, example: [TerrainType.GRAVEL] })
  terrainTypes!: TerrainType[];

  @ApiProperty({ nullable: true, enum: TireUsageType, example: TireUsageType.GRAVEL })
  usageType!: TireUsageType | null;

  @ApiProperty({ nullable: true, example: 'Power' })
  familyName!: string | null;

  @ApiProperty({ nullable: true, example: 'Adventure' })
  productRange!: string | null;

  @ApiProperty({
    enum: TirePerformanceProfile,
    isArray: true,
    example: [TirePerformanceProfile.GRIP],
  })
  performanceProfiles!: TirePerformanceProfile[];
}

export class AiTireRecommendationResponseDto {
  @ApiProperty({ type: () => [AiRecommendedTireResponseDto] })
  recommendations!: AiRecommendedTireResponseDto[];
}
