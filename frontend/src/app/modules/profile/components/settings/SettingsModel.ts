export interface ISettings {
  setupEmailNotifications: {
    emailNotifications: boolean
    sendCopyToPersonalEmail: boolean
  }
  activityRelatedEmail: {
    whenToEmail: {
      youHaveNewNotifications: boolean
      youAreADirectMessage: boolean
      someoneAddsYouAsAConnection: boolean
    }
    whenToEscalateEmails: {
      uponNewOrder: boolean
      newMembershipApproval: boolean
      memberRegistration: boolean
    }
  }
  updatesFromiuppy!: {
    newsAboutKTProducts: boolean
    tipsOnGettingMore: boolean
    thingsYouMissed: boolean
    newsAboutKTPartners: boolean
  }
}

export const defaultSettings: ISettings = {
  setupEmailNotifications: {
    emailNotifications: true,
    sendCopyToPersonalEmail: false,
  },
  activityRelatedEmail: {
    whenToEmail: {
      youHaveNewNotifications: true,
      youAreADirectMessage: false,
      someoneAddsYouAsAConnection: false,
    },
    whenToEscalateEmails: {
      uponNewOrder: true,
      newMembershipApproval: false,
      memberRegistration: false,
    },
  },
  updatesFromiuppy!: {
    newsAboutKTProducts: false,
    tipsOnGettingMore: false,
    thingsYouMissed: false,
    newsAboutKTPartners: false,
  },
}
