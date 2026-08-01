import { ImageResponse } from 'next/og';

export const alt = 'Minh Finance - Ghi thu chi đơn giản mỗi ngày';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const runtime = 'edge';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        color: '#172033',
        background:
          'radial-gradient(circle at 85% 16%, #dcd4ff 0, transparent 28%), linear-gradient(135deg, #faf9ff 0%, #ffffff 58%, #f2f0ff 100%)',
        fontFamily: 'Arial, sans-serif',
        padding: '68px 78px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '605px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '48px',
            color: '#4e35c7',
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '17px',
              color: 'white',
              background: 'linear-gradient(135deg, #8b72ff, #5534dd)',
            }}
          >
            M
          </div>
          Minh Finance
        </div>
        <div style={{ display: 'flex', color: '#684be7', fontSize: 18, fontWeight: 800 }}>
          SỔ THU CHI NHẸ NHÀNG MỖI NGÀY
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: '16px',
            fontSize: 64,
            lineHeight: 1.04,
            letterSpacing: '-3px',
            fontWeight: 800,
          }}
        >
          Tiền đi đâu, bạn biết rõ.
        </div>
        <div style={{ display: 'flex', marginTop: '22px', color: '#667085', fontSize: 24 }}>
          Ghi thu chi đơn giản cho cuộc sống chủ động hơn.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '360px',
          padding: '27px',
          border: '1px solid #dedaf7',
          borderRadius: '28px',
          background: '#ffffff',
          boxShadow: '0 25px 50px rgba(69, 47, 157, .17)',
          transform: 'rotate(4deg)',
        }}
      >
        <div style={{ display: 'flex', marginBottom: '20px', color: '#7b849a', fontSize: 16 }}>
          Tháng này
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '22px',
            borderRadius: '19px',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #7357ff, #4e31c9)',
          }}
        >
          <div style={{ display: 'flex', fontSize: 16, opacity: 0.78 }}>Số tiền còn lại</div>
          <div style={{ display: 'flex', marginTop: '6px', fontSize: 31, fontWeight: 800 }}>
            2.450.000 đ
          </div>
          <div style={{ display: 'flex', marginTop: '9px', color: '#ceffec', fontSize: 14 }}>
            Chủ động từng khoản nhỏ
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', color: '#7b849a', fontSize: 14 }}>Đã thu</div>
            <div
              style={{
                display: 'flex',
                marginTop: '5px',
                color: '#139d73',
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              6.800.000 đ
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', color: '#7b849a', fontSize: 14 }}>Đã chi</div>
            <div
              style={{
                display: 'flex',
                marginTop: '5px',
                color: '#e46473',
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              4.350.000 đ
            </div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
