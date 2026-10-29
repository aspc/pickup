'use client'

import { useEffect, useState } from 'react'
import StarRating from '@/components/feedback/StarRating'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardFooter } from '@/components/ui/Card'
import { Field, Select, Textarea } from '@/components/ui/Field'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { postJson, requestJson } from '@/utils/api'

export default function FeedbackForm() {
  type Ride = {
    flight_id: string
    Flights: {
      date: string
      to_airport: boolean
      airport: string
    } | null
  }

  const [rides, setRides] = useState<Ride[]>([])
  const [selectedFlight, setSelectedFlight] = useState('')
  const [overall, setOverall] = useState<number>(0)
  const [convenience, setConvenience] = useState<number>(0)
  const [comments, setComments] = useState('')

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const result = await requestJson<{
          success: boolean
          rides: Ride[]
        }>('/api/feedback')
        setRides(result.rides || [])
      } catch (error) {
        console.error('Error fetching rides:', error)
      }
    }

    void fetchRides()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (!selectedFlight) {
      setErrorMessage('Please select a match before submitting.')
      return
    }

    if (overall < 1 || convenience < 1) {
      setErrorMessage(
        'Please provide a rating for both overall and convenience.',
      )
      return
    }

    try {
      await postJson('/api/feedback', {
        flightId: Number(selectedFlight),
        overall,
        convenience,
        comments,
      })

      setSuccessMessage('Feedback submitted successfully!')
      setSelectedFlight('')
      setOverall(0)
      setConvenience(0)
      setComments('')
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      setErrorMessage(
        `Error submitting feedback: ${error?.message || 'Unknown error'}`,
      )
    }
  }

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const rideOptions = rides.flatMap((ride) => {
    if (!ride.Flights?.date) return []
    const [year, month, day] = ride.Flights.date.split('-').map(Number)
    const flightDate = new Date(year, month - 1, day)
    if (flightDate < oneYearAgo) return []
    const label = `${flightDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
    })} - ${
      ride.Flights.to_airport
        ? 'School to ' + ride.Flights.airport
        : ride.Flights.airport + ' to School'
    }`
    return [{ value: ride.flight_id, label }]
  })

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Your rides"
        title="Leave feedback"
        description="We value your feedback. Help us improve PICKUP for everyone."
      />

      <Card as="form" onSubmit={handleSubmit}>
        <CardBody className="space-y-6">
          {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}
          {successMessage && <Alert tone="success">{successMessage}</Alert>}

          <Field label="Select match" htmlFor="feedback-match" required>
            <Select
              id="feedback-match"
              value={selectedFlight}
              onChange={(e) => setSelectedFlight(e.target.value)}
              required
            >
              <option value="">Select a match</option>
              {rideOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-ink">
                Overall rating
                <span aria-hidden className="ml-0.5 text-danger">
                  *
                </span>
              </p>
              <StarRating
                label="Overall rating"
                rating={overall}
                onChange={(newRating) => setOverall(newRating)}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-ink">
                Convenience rating
                <span aria-hidden className="ml-0.5 text-danger">
                  *
                </span>
              </p>
              <StarRating
                label="Convenience rating"
                rating={convenience}
                onChange={(newRating) => setConvenience(newRating)}
              />
            </div>
          </div>

          <Field label="Comments (optional)" htmlFor="feedback-comments">
            <Textarea
              id="feedback-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              placeholder="Share your experience or suggestions..."
            />
          </Field>
        </CardBody>
        <CardFooter>
          <Button type="submit" size="lg" fullWidth>
            Submit feedback
          </Button>
        </CardFooter>
      </Card>
    </PageContainer>
  )
}
