import { CreateSurveyDto, UpdateSurveyDto } from '@shared/types'
import { SurveyService } from '../services/surveys.service'

export const useSurveysActions = () => {
    const create = async (
        companyId: string,
        dto: CreateSurveyDto,
        setSuccess: (val: boolean) => void,
        setError: (val: boolean) => void
    ) => {
        try {
            await SurveyService.create(companyId, dto)
            setSuccess(true)
        } catch (error) {
            console.error(error)
            setError(true)
        }
    }

    const update = async (
        companyId: string,
        id: string,
        dto: UpdateSurveyDto,
        setSuccess: (val: boolean) => void,
        setError: (val: boolean) => void
    ) => {
        try {
            await SurveyService.update(companyId, id, dto)
            setSuccess(true)
        } catch (error) {
            console.error(error)
            setError(true)
        }
    }

    const remove = async (
        companyId: string,
        id: string,
        setSuccess: (val: boolean) => void,
        setError: (val: boolean) => void
    ) => {
        try {
            await SurveyService.remove(companyId, id)
            setSuccess(true)
        } catch (error) {
            console.error(error)
            setError(true)
        }
    }

    return { create, update, remove }
}