/* eslint-disable */
import * as Router from "expo-router";

export * from "expo-router";

declare module "expo-router" {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams:
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(auth)"}/login` | `/login`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(root)"}` | `/`; params?: Router.UnknownInputParams }
        | { pathname: `/console/profile`; params?: Router.UnknownInputParams }
        | {
            pathname: `/console${"/(tabs)"}/exam-papers-modal` | `/console/exam-papers-modal`;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/console${"/(tabs)"}/exams` | `/console/exams`; params?: Router.UnknownInputParams }
        | { pathname: `/console${"/(tabs)"}/fees` | `/console/fees`; params?: Router.UnknownInputParams }
        | { pathname: `/console${"/(tabs)"}` | `/console`; params?: Router.UnknownInputParams }
        | { pathname: `/console${"/(tabs)"}/library` | `/console/library`; params?: Router.UnknownInputParams }
        | { pathname: `/console${"/(tabs)"}/study-notes` | `/console/study-notes`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics/adm-registration`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics/cu-exam-form-upload`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics/current-status`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics/subject-selection-instructions`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics/subject-selection`; params?: Router.UnknownInputParams }
        | { pathname: `/console/contact`; params?: Router.UnknownInputParams }
        | { pathname: `/console/documents`; params?: Router.UnknownInputParams }
        | { pathname: `/console/events`; params?: Router.UnknownInputParams }
        | { pathname: `/console/faqs`; params?: Router.UnknownInputParams }
        | { pathname: `/console/notifications`; params?: Router.UnknownInputParams }
        | { pathname: `/console/service-requests`; params?: Router.UnknownInputParams }
        | { pathname: `/console/settings`; params?: Router.UnknownInputParams }
        | { pathname: `/console/support`; params?: Router.UnknownInputParams }
        | { pathname: `/console/exams/[id]`; params: Router.UnknownInputParams & { id: string | number } };
      hrefOutputParams:
        | { pathname: Router.RelativePathString; params?: Router.UnknownOutputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownOutputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams }
        | { pathname: `${"/(auth)"}/login` | `/login`; params?: Router.UnknownOutputParams }
        | { pathname: `${"/(root)"}` | `/`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/profile`; params?: Router.UnknownOutputParams }
        | {
            pathname: `/console${"/(tabs)"}/exam-papers-modal` | `/console/exam-papers-modal`;
            params?: Router.UnknownOutputParams;
          }
        | { pathname: `/console${"/(tabs)"}/exams` | `/console/exams`; params?: Router.UnknownOutputParams }
        | { pathname: `/console${"/(tabs)"}/fees` | `/console/fees`; params?: Router.UnknownOutputParams }
        | { pathname: `/console${"/(tabs)"}` | `/console`; params?: Router.UnknownOutputParams }
        | { pathname: `/console${"/(tabs)"}/library` | `/console/library`; params?: Router.UnknownOutputParams }
        | { pathname: `/console${"/(tabs)"}/study-notes` | `/console/study-notes`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/academics/adm-registration`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/academics/cu-exam-form-upload`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/academics/current-status`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/academics`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/academics/subject-selection-instructions`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/academics/subject-selection`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/contact`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/documents`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/events`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/faqs`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/notifications`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/service-requests`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/settings`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/support`; params?: Router.UnknownOutputParams }
        | { pathname: `/console/exams/[id]`; params: Router.UnknownOutputParams & { id: string } };
      href:
        | Router.RelativePathString
        | Router.ExternalPathString
        | `/_sitemap${`?${string}` | `#${string}` | ""}`
        | `${"/(auth)"}/login${`?${string}` | `#${string}` | ""}`
        | `/login${`?${string}` | `#${string}` | ""}`
        | `${"/(root)"}${`?${string}` | `#${string}` | ""}`
        | `/${`?${string}` | `#${string}` | ""}`
        | `/console/profile${`?${string}` | `#${string}` | ""}`
        | `/console${"/(tabs)"}/exam-papers-modal${`?${string}` | `#${string}` | ""}`
        | `/console/exam-papers-modal${`?${string}` | `#${string}` | ""}`
        | `/console${"/(tabs)"}/exams${`?${string}` | `#${string}` | ""}`
        | `/console/exams${`?${string}` | `#${string}` | ""}`
        | `/console${"/(tabs)"}/fees${`?${string}` | `#${string}` | ""}`
        | `/console/fees${`?${string}` | `#${string}` | ""}`
        | `/console${"/(tabs)"}${`?${string}` | `#${string}` | ""}`
        | `/console${`?${string}` | `#${string}` | ""}`
        | `/console${"/(tabs)"}/library${`?${string}` | `#${string}` | ""}`
        | `/console/library${`?${string}` | `#${string}` | ""}`
        | `/console${"/(tabs)"}/study-notes${`?${string}` | `#${string}` | ""}`
        | `/console/study-notes${`?${string}` | `#${string}` | ""}`
        | `/console/academics/adm-registration${`?${string}` | `#${string}` | ""}`
        | `/console/academics/cu-exam-form-upload${`?${string}` | `#${string}` | ""}`
        | `/console/academics/current-status${`?${string}` | `#${string}` | ""}`
        | `/console/academics${`?${string}` | `#${string}` | ""}`
        | `/console/academics/subject-selection-instructions${`?${string}` | `#${string}` | ""}`
        | `/console/academics/subject-selection${`?${string}` | `#${string}` | ""}`
        | `/console/contact${`?${string}` | `#${string}` | ""}`
        | `/console/documents${`?${string}` | `#${string}` | ""}`
        | `/console/events${`?${string}` | `#${string}` | ""}`
        | `/console/faqs${`?${string}` | `#${string}` | ""}`
        | `/console/notifications${`?${string}` | `#${string}` | ""}`
        | `/console/service-requests${`?${string}` | `#${string}` | ""}`
        | `/console/settings${`?${string}` | `#${string}` | ""}`
        | `/console/support${`?${string}` | `#${string}` | ""}`
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(auth)"}/login` | `/login`; params?: Router.UnknownInputParams }
        | { pathname: `${"/(root)"}` | `/`; params?: Router.UnknownInputParams }
        | { pathname: `/console/profile`; params?: Router.UnknownInputParams }
        | {
            pathname: `/console${"/(tabs)"}/exam-papers-modal` | `/console/exam-papers-modal`;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/console${"/(tabs)"}/exams` | `/console/exams`; params?: Router.UnknownInputParams }
        | { pathname: `/console${"/(tabs)"}/fees` | `/console/fees`; params?: Router.UnknownInputParams }
        | { pathname: `/console${"/(tabs)"}` | `/console`; params?: Router.UnknownInputParams }
        | { pathname: `/console${"/(tabs)"}/library` | `/console/library`; params?: Router.UnknownInputParams }
        | { pathname: `/console${"/(tabs)"}/study-notes` | `/console/study-notes`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics/adm-registration`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics/cu-exam-form-upload`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics/current-status`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics/subject-selection-instructions`; params?: Router.UnknownInputParams }
        | { pathname: `/console/academics/subject-selection`; params?: Router.UnknownInputParams }
        | { pathname: `/console/contact`; params?: Router.UnknownInputParams }
        | { pathname: `/console/documents`; params?: Router.UnknownInputParams }
        | { pathname: `/console/events`; params?: Router.UnknownInputParams }
        | { pathname: `/console/faqs`; params?: Router.UnknownInputParams }
        | { pathname: `/console/notifications`; params?: Router.UnknownInputParams }
        | { pathname: `/console/service-requests`; params?: Router.UnknownInputParams }
        | { pathname: `/console/settings`; params?: Router.UnknownInputParams }
        | { pathname: `/console/support`; params?: Router.UnknownInputParams }
        | `/console/exams/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ""}`
        | { pathname: `/console/exams/[id]`; params: Router.UnknownInputParams & { id: string | number } };
    }
  }
}
