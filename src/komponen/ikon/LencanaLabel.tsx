import { NAMA_LABEL, type LabelLangkah } from '../../inti/penilaian/label'
import { IkonLabel } from './LabelLangkah'
import './LencanaLabel.css'

export function LencanaLabel({ label }: { label: LabelLangkah }) {
  return (
    <span className={`lencana-label lencana-label--${label}`}>
      <IkonLabel label={label} ukuran={20} teksAlternatif="" />
      <span>{NAMA_LABEL[label]}</span>
    </span>
  )
}
