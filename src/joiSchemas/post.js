import JoiObjectId from './JoiObjectId'

export const createPost = userId => JoiObjectId.object().keys({
  body: JoiObjectId.string().min(2).max(500).label('Post Body'),
  createdBy: JoiObjectId.string().objectId().label('User ID')
})
