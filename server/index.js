import express from 'express'
import cors from 'cors'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 現在のファイルのディレクトリを取得
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 環境変数の読み込み（serverディレクトリから）
dotenv.config({ path: join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 3002

// 認証設定
const CORRECT_PASSWORD = '1207'
const JWT_SECRET = process.env.JWT_SECRET || 'wedding-photo-secret-key-change-in-production'
const JWT_EXPIRES_IN = '24h' // 24時間有効

// 環境変数の確認
console.log('環境変数の確認:')
console.log('- AWS_REGION:', process.env.AWS_REGION || '未設定')
console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '設定済み' : '未設定')
console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '設定済み' : '未設定')
console.log('- S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME || '未設定')

// CORS設定
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001',
  // 本番環境のURLを追加（環境変数から取得）
  process.env.FRONTEND_URL,
].filter(Boolean) // undefinedを除外

// デバッグ用: 許可されているオリジンをログに出力
console.log('許可されているCORSオリジン:', allowedOrigins)

app.use(cors({
  origin: (origin, callback) => {
    // オリジンなしのリクエスト（Postman、curl等）は許可
    if (!origin) {
      console.log('オリジンなしのリクエストを許可')
      return callback(null, true)
    }

    // 許可リストに含まれているか確認
    if (allowedOrigins.includes(origin)) {
      console.log(`許可されたオリジン: ${origin}`)
      return callback(null, true)
    }

    // 拒否されたオリジンをログに出力
    console.error(`CORSエラー: オリジン "${origin}" は許可されていません`)
    console.error('許可されているオリジン:', allowedOrigins)
    console.error('FRONTEND_URL環境変数:', process.env.FRONTEND_URL || '未設定')

    callback(new Error(`CORS policyで許可されていません。オリジン: ${origin}`))
  },
  credentials: true
}))

app.use(express.json())

// Multer設定（メモリストレージを使用）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB制限
  },
  fileFilter: (req, file, cb) => {
    // 画像ファイルのみを許可
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('画像ファイルのみアップロードできます（JPEG, PNG, GIF, WebP, BMP）'), false)
    }
  },
})

// S3クライアントの初期化
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const bucketName = process.env.S3_BUCKET_NAME || ''

// DynamoDBクライアントの初期化
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const docClient = DynamoDBDocumentClient.from(dynamoClient)
const commentsTableName = 'weddingComment'

// 認証ミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '認証トークンが必要です' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '無効なトークンです' })
    }
    req.user = user
    next()
  })
}

// 認証API（パスワードログイン）
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ error: 'パスワードが入力されていません' })
    }

    if (password !== CORRECT_PASSWORD) {
      return res.status(401).json({ error: 'パスワードが正しくありません' })
    }

    // JWTトークンを生成
    const token = jwt.sign(
      { authenticated: true },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
      success: true,
      token: token,
      expiresIn: JWT_EXPIRES_IN,
    })
  } catch (error) {
    console.error('ログインエラー:', error)
    res.status(500).json({
      error: 'ログインに失敗しました',
      message: error.message
    })
  }
})

// トークン検証API
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
  })
})

// 写真一覧を取得するAPI（ページネーション対応）
app.get('/api/photos/list', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 100
    const offset = (page - 1) * limit

    if (!bucketName) {
      return res.status(500).json({ error: 'S3バケット名が設定されていません' })
    }

    // S3バケットのuploadsフォルダからオブジェクトをリストアップ
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'uploads/',
    })

    const response = await s3Client.send(command)

    if (!response.Contents || response.Contents.length === 0) {
      return res.json({
        photos: [],
        total: 0,
        page: page,
        limit: limit,
        totalPages: 0,
      })
    }

    // 画像ファイルのみをフィルタリング
    const imageFiles = response.Contents.filter(item => {
      const key = item.Key?.toLowerCase() || ''
      return key.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)
    })

    // 日付順にソート（新しい順）
    imageFiles.sort((a, b) => {
      const dateA = a.LastModified?.getTime() || 0
      const dateB = b.LastModified?.getTime() || 0
      return dateB - dateA
    })

    const total = imageFiles.length
    const totalPages = Math.ceil(total / limit)
    const paginatedFiles = imageFiles.slice(offset, offset + limit)

    // 各ファイルの署名付きURLを生成
    const photoUrls = await Promise.all(
      paginatedFiles.map(async (file) => {
        const getObjectCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: file.Key,
        })

        const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
          expiresIn: 3600, // 1時間有効
        })

        return {
          url: signedUrl,
          key: file.Key,
          name: file.Key.split('/').pop(),
          lastModified: file.LastModified?.toISOString() || null,
        }
      })
    )

    res.json({
      photos: photoUrls,
      total: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
    })
  } catch (error) {
    console.error('S3から写真一覧を取得する際にエラーが発生しました:', error)
    res.status(500).json({
      error: '写真一覧の取得に失敗しました',
      message: error.message
    })
  }
})

// ランダムに写真を取得するAPI
app.get('/api/photos/random', authenticateToken, async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10

    if (!bucketName) {
      return res.status(500).json({ error: 'S3バケット名が設定されていません' })
    }

    // S3バケットのuploadsフォルダからオブジェクトをリストアップ
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'uploads/',
    })

    const response = await s3Client.send(command)

    if (!response.Contents || response.Contents.length === 0) {
      return res.status(404).json({ error: 'バケットに写真が見つかりませんでした' })
    }

    // 画像ファイルのみをフィルタリング
    const imageFiles = response.Contents.filter(item => {
      const key = item.Key?.toLowerCase() || ''
      return key.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)
    })

    if (imageFiles.length === 0) {
      return res.status(404).json({ error: '画像ファイルが見つかりませんでした' })
    }

    // ランダムに選択
    const shuffled = [...imageFiles].sort(() => 0.5 - Math.random())
    const selectedFiles = shuffled.slice(0, Math.min(count, shuffled.length))

    // 各ファイルの署名付きURLを生成
    const photoUrls = await Promise.all(
      selectedFiles.map(async (file) => {
        const getObjectCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: file.Key,
        })

        const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
          expiresIn: 3600, // 1時間有効
        })

        return {
          url: signedUrl,
          key: file.Key,
          name: file.Key.split('/').pop(),
        }
      })
    )

    res.json(photoUrls)
  } catch (error) {
    console.error('S3から写真を取得する際にエラーが発生しました:', error)
    res.status(500).json({
      error: '写真の取得に失敗しました',
      message: error.message
    })
  }
})

// 写真をアップロードするAPI（複数ファイル対応）
app.post('/api/photos/upload', authenticateToken, upload.array('photos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'ファイルが選択されていません' })
    }

    if (!bucketName) {
      return res.status(500).json({ error: 'S3バケット名が設定されていません' })
    }

    const uploadedPhotos = []
    const errors = []

    // 各ファイルをアップロード
    for (const file of req.files) {
      try {
        // ファイル名を生成（タイムスタンプ + 元のファイル名）
        const timestamp = Date.now()
        const randomSuffix = Math.floor(Math.random() * 10000) // 重複を避けるためランダムな数値を追加
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_') // 特殊文字を置換
        const fileName = `uploads/${timestamp}-${randomSuffix}-${originalName}`

        // S3にアップロード
        const putObjectCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })

        await s3Client.send(putObjectCommand)

        console.log(`写真がアップロードされました: ${fileName}`)

        // アップロードされたファイルの署名付きURLを生成
        const getObjectCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: fileName,
        })

        const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
          expiresIn: 3600, // 1時間有効
        })

        uploadedPhotos.push({
          url: signedUrl,
          key: fileName,
          name: originalName,
        })
      } catch (error) {
        console.error(`ファイル ${file.originalname} のアップロードエラー:`, error)
        errors.push({
          fileName: file.originalname,
          error: error.message,
        })
      }
    }

    // 結果を返す
    if (uploadedPhotos.length === 0) {
      return res.status(500).json({
        error: 'すべてのファイルのアップロードに失敗しました',
        errors: errors,
      })
    }

    res.json({
      success: true,
      message: `${uploadedPhotos.length}件の写真がアップロードされました`,
      photos: uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('写真のアップロードエラー:', error)
    res.status(500).json({
      error: '写真のアップロードに失敗しました',
      message: error.message,
    })
  }
})

// コメント一覧を取得するAPI
app.get('/api/comments', authenticateToken, async (req, res) => {
  try {
    // DynamoDBからすべてのコメントをスキャン
    const command = new ScanCommand({
      TableName: commentsTableName,
    })

    const response = await docClient.send(command)
    const comments = response.Items || []

    // timestampでソート（新しい順）
    comments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

    // シンプルな構造に変換（id, comment, timestampのみ）
    const simplifiedComments = comments.map(item => ({
      id: item.id,
      comment: item.comment,
      timestamp: item.timestamp,
    }))

    res.json(simplifiedComments)
  } catch (error) {
    console.error('コメントの取得エラー:', error)
    res.status(500).json({
      error: 'コメントの取得に失敗しました',
      message: error.message
    })
  }
})

// コメントを投稿するAPI
app.post('/api/comments', authenticateToken, async (req, res) => {
  try {
    const { comment } = req.body

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        error: 'コメントが空です'
      })
    }

    // コメントの長さ制限（140文字）
    if (comment.length > 140) {
      return res.status(400).json({
        error: 'コメントは140文字以内で入力してください'
      })
    }

    // IDとタイムスタンプを生成
    const id = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()

    // DynamoDBに保存
    const command = new PutCommand({
      TableName: commentsTableName,
      Item: {
        id: id,
        comment: comment.trim(),
        timestamp: timestamp,
      },
    })

    await docClient.send(command)

    console.log(`コメントが投稿されました: ${id}`)

    res.json({
      success: true,
      comment: {
        id: id,
        comment: comment.trim(),
        timestamp: timestamp,
      },
    })
  } catch (error) {
    console.error('コメントの投稿エラー:', error)
    res.status(500).json({
      error: 'コメントの投稿に失敗しました',
      message: error.message
    })
  }
})

// ヘルスチェック（認証不要）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`\n✅ サーバーがポート ${PORT} で起動しました`)
  console.log(`📡 写真API: http://localhost:${PORT}/api/photos/random`)
  console.log(`📤 写真アップロードAPI: http://localhost:${PORT}/api/photos/upload`)
  console.log(`💬 コメントAPI: http://localhost:${PORT}/api/comments`)
  console.log(`❤️  ヘルスチェック: http://localhost:${PORT}/api/health\n`)
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ エラー: ポート ${PORT} は既に使用されています`)
    console.error('別のポートを使用するか、既存のプロセスを終了してください')
  } else {
    console.error('❌ サーバーの起動に失敗しました:', err)
  }
  process.exit(1)
})
