export interface AudienceFilter {
  spaceIds?: string[];       // OR
  channelIds?: string[];     // OR
  groupIds?: string[];       // OR
  includeUserIds?: string[]; // add
  excludeUserIds?: string[]; // subtract
}