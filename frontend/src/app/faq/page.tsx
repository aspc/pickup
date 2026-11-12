import Link from 'next/link'

import { Accordion } from '@/components/ui/Accordion'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'

const FAQ_ITEMS = [
  {
    id: 'q1',
    title: 'Can I edit my questionnaire?',
    content: (
      <>
        You can edit your information{' '}
        <strong>UP TO 3 DAYS BEFORE YOUR FLIGHT.</strong> Otherwise, you must
        cancel it and send in a new questionnaire. In that case, on your
        questionnaire, you can opt in to be placed in the unmatched section
        where you can try to find others who you may be able to split a ride
        with.
      </>
    ),
  },
  {
    id: 'q2',
    title: 'When will I know who I am matched with?',
    content: (
      <>
        We will display your match 3 DAYS BEFORE YOUR FLIGHT, unless you do not
        submit your questionnaire more than 3 days in advance. In that case, on
        your questionnaire, you can opt in to be placed in the unmatched section
        where you can try to find others who you may be able to split a ride
        with.
      </>
    ),
  },
  {
    id: 'q3',
    title: 'What happens if I’m not matched?',
    content: (
      <>
        When you fill out your questionnaire form, you have the option to opt in
        to be placed in the unmatched section if we can’t find you a match. This
        page will help you find others who you may be able to split a ride with.
      </>
    ),
  },
  {
    id: 'q4',
    title:
      'What happens if I or someone in my group has a delayed/canceled flight?',
    content: (
      <>
        Please utilize the commenting system on your match so that you can
        update your group members about any issues. We hope your group can come
        to an agreement if this happens, for example, how long of a delay is too
        long for group members to wait for you. The delayed member can always
        opt in to the unmatched section to find others.
      </>
    ),
  },
  {
    id: 'q5',
    title:
      'What if I need to cancel my questionnaire/match due to unforeseen circumstances?',
    content: (
      <>
        We understand travelling can be unpredictable. If at all possible,
        please cancel your questionnaire form for your flight at least 3 days in
        advance of your flight. This way, you will not be affecting any group
        creations. <br /> If that is not possible, then you can cancel, but keep
        in mind that this will affect the others assigned to your group.
      </>
    ),
  },
  {
    id: 'q6',
    title: 'Can I get a rematch?',
    content: (
      <>
        You cannot request a rematch at this time. If you are dissatisfied with
        your match, you can cancel. If you resend in a questionnaire and opt in
        to being in the unmatched section, you can find others who you may be
        able to split a ride with.
      </>
    ),
  },
  {
    id: 'q7',
    title: 'How does the Unmatched page work?',
    content: (
      <>
        If you are within 3 days of your upcoming flight and have not been
        matched, you can check out our unmatched page and try to join other
        groups! Browse through groups and individuals who are in the same boat
        as you. Send a join request if you find something that works for you!
        NOTE: this is only available if you opted in when you filled out your
        questionnaire for that flight.
      </>
    ),
  },
  {
    id: 'q8',
    title: 'How exactly am I being matched?',
    content: (
      <>
        We are using a machine learning model to group all of our existing match
        requests by flight time, bag numbers, terminals, drop off points, and
        other important details. Our model’s performance improves as our user
        base increases, so please spread the word about RideLink! Further,
        please submit feedback on matches so that we can improve our model in
        the future!
      </>
    ),
  },
  {
    id: 'q9',
    title: 'What information is shared with other users?',
    content: (
      <>
        We aim to keep our users as anonymous as possible. Once you’ve matched
        with a group, we provide the group members your first name and email. We
        do not share your flight info, last name, or phone number. Further, we
        do not share any personal info with people not in your group.
      </>
    ),
  },
  {
    id: 'q10',
    title: 'What if I didn’t get the price that I was hoping for?',
    content: (
      <>
        We will try our best to get a match that has a price within your budget
        but we cannot guarantee this. We assure you that our machine learning
        model will try to find the optimal match for you! Our model’s
        performance improves as our user base increases, so please spread the
        word about RideLink! Also, submit feedback so we can train our model to
        be better!
      </>
    ),
  },
]

export default function Faq() {
  return (
    <PageContainer width="prose">
      <PageHeader
        eyebrow="Help"
        title="Frequently asked questions"
        description="Why pay $100 for a ride to the airport? We help you split the cost and share the journey."
      />
      <Accordion items={FAQ_ITEMS} defaultOpenId="q1" />
      <p className="mt-8 text-[15px] text-stone">
        If you have any other questions, please{' '}
        <Link
          href="/contact"
          className="font-medium text-navy underline underline-offset-2 hover:text-sage"
        >
          contact us
        </Link>
        .
      </p>
    </PageContainer>
  )
}
