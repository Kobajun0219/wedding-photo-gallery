import express from 'express'
import cors from 'cors'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
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

// ランダムに写真を取得するAPI
app.get('/api/photos/random', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10

    if (!bucketName) {
      return res.status(500).json({ error: 'S3バケット名が設定されていません' })
    }

    // S3バケットからすべてのオブジェクトをリストアップ
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
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

// コメント一覧を取得するAPI
app.get('/api/comments', async (req, res) => {
  try {
    // DynamoDBからすべてのコメントをスキャン
    const command = new ScanCommand({
      TableName: commentsTableName,
    })

    const response = await docClient.send(command)
    const comments = response.Items || []

    // timestampでソート（新しい順）
    comments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

    res.json(comments)
  } catch (error) {
    console.error('コメントの取得エラー:', error)
    res.status(500).json({
      error: 'コメントの取得に失敗しました',
      message: error.message
    })
  }
})

// コメントを投稿するAPI（LINE経由で投稿されるため、このエンドポイントは使用しない可能性があります）
app.post('/api/comments', async (req, res) => {
  try {
    const { message } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'メッセージが空です'
      })
    }

    // このエンドポイントはLINE経由でコメントが投稿されるため、
    // 直接フロントエンドから投稿する場合は別の実装が必要です
    res.status(501).json({
      error: 'このエンドポイントは現在使用できません。LINE経由でコメントを投稿してください。'
    })
  } catch (error) {
    console.error('コメントの投稿エラー:', error)
    res.status(500).json({
      error: 'コメントの投稿に失敗しました',
      message: error.message
    })
  }
})

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`\n✅ サーバーがポート ${PORT} で起動しました`)
  console.log(`📡 写真API: http://localhost:${PORT}/api/photos/random`)
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
