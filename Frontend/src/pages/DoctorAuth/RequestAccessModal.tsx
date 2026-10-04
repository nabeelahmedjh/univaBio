import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { BoxInput } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/errors'

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  clinic: z.string().trim().min(2, 'Please tell us your clinic or practice.'),
  message: z.string().trim().max(600).optional(),
})
type Values = z.infer<typeof schema>

/** "Request access" contact form for doctors without credentials. */
export function RequestAccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string>()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const close = () => {
    onClose()
    setTimeout(() => {
      setSent(false)
      reset()
    }, 400)
  }

  const onSubmit = async (v: Values) => {
    setServerError(undefined)
    try {
      await api.requestAccess(v)
      setSent(true)
    } catch (e) {
      setServerError(errorMessage(e))
    }
  }

  return (
    <Modal open={open} onClose={close} eyebrow="Request access" title={sent ? 'Thank you.' : 'Join Continuo'}>
      {sent ? (
        <div>
          <p className="text-[15px] text-stone">
            We have your details. Someone from our team will be in touch within two working days to set up your clinic.
          </p>
          <Button className="mt-8" onClick={close}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
          <p className="mb-4 text-[14px] text-stone">
            Accounts are created by your clinic administrator. If your clinic is new to Continuo, leave your details and
            we will reach out.
          </p>
          <BoxInput label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
          <BoxInput label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <BoxInput label="Clinic or practice" autoComplete="organization" error={errors.clinic?.message} {...register('clinic')} />
          <div>
            <label htmlFor="ra-msg" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-stone">
              Message <span className="normal-case tracking-normal text-stone/70">(optional)</span>
            </label>
            <textarea id="ra-msg" rows={3} className="field-box resize-none" {...register('message')} />
          </div>
          {serverError && <p className="field-error" role="alert">{serverError}</p>}
          <div className="pt-4">
            <Button type="submit" loading={isSubmitting} loadingText="Sending…" block>
              Send request
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
