import KenworthCab from './body/KenworthCab'
import KenworthChassis from './body/KenworthChassis'
import KenworthGrille from './body/KenworthGrille'
import KenworthHood from './body/KenworthHood'

export default function TractomulaBody() {
  return (
    <group>
      <KenworthHood />
      <KenworthGrille />
      <KenworthCab />
      <KenworthChassis />
    </group>
  )
}
