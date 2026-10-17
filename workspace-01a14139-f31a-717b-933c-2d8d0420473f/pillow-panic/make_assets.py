from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFilter, ImageEnhance
import urllib.request

ROOT=Path(__file__).parent
assets=ROOT/'assets'
assets.mkdir(exist_ok=True)
im=ImageOps.exif_transpose(Image.open('/home/user/uploads/20261015_231527.jpg')).convert('RGB')
scale=im.width/1568
points={
 'yanivo':[(1048,112),(1081,101),(1119,93),(1150,94),(1171,99),(1198,99),(1214,112),(1226,135),(1237,161),(1245,190),(1252,222),(1257,257),(1259,293),(1260,329),(1263,357),(1272,370),(1274,396),(1271,420),(1262,440),(1262,468),(1257,500),(1245,528),(1231,553),(1216,584),(1197,613),(1175,635),(1148,651),(1118,661),(1087,659),(1058,647),(1032,628),(1008,607),(988,578),(976,547),(965,518),(953,486),(942,458),(933,435),(920,420),(912,400),(909,380),(915,362),(914,340),(913,311),(915,280),(920,254),(929,228),(943,202),(953,179),(974,155),(995,141),(1021,129)],
 'elish':[(451,94),(489,92),(525,93),(556,103),(586,102),(620,117),(650,122),(677,137),(701,160),(720,188),(733,219),(746,247),(753,276),(758,308),(754,338),(751,369),(743,400),(735,426),(723,452),(715,480),(705,509),(704,540),(707,574),(699,603),(683,623),(662,631),(638,630),(618,616),(601,609),(578,609),(552,599),(528,588),(503,573),(482,550),(464,524),(449,494),(437,466),(429,436),(422,410),(416,389),(409,385),(403,411),(402,447),(402,478),(396,517),(387,555),(376,592),(359,620),(335,632),(311,619),(296,593),(287,563),(280,534),(267,509),(260,484),(266,450),(274,417),(281,384),(294,348),(303,316),(307,282),(317,250),(334,223),(354,199),(379,178),(398,155),(411,132),(428,110)]
}

def smooth_poly(pts):
 out=[]
 n=len(pts)
 for i in range(n):
  p0,p1,p2,p3=[pts[j%n] for j in (i-1,i,i+1,i+2)]
  for k in range(8):
   t=k/8
   xy=[]
   for a in (0,1):
    xy.append(.5*((2*p1[a])+(-p0[a]+p2[a])*t+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*t*t+(-p0[a]+3*p1[a]-3*p2[a]+p3[a])*t*t*t)*scale)
   out.append(tuple(xy))
 return out

for name,pts in points.items():
 mask=Image.new('L',im.size)
 ImageDraw.Draw(mask).polygon(smooth_poly(pts),fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(1.1))
 box=mask.getbbox()
 portrait=im.crop(box)
 portrait=ImageEnhance.Contrast(portrait).enhance(1.08)
 portrait=ImageEnhance.Color(portrait).enhance(1.08)
 portrait.putalpha(mask.crop(box))
 portrait.thumbnail((420,520),Image.Resampling.LANCZOS)
 pad=10
 a=Image.new('RGBA',(portrait.width+2*pad,portrait.height+2*pad))
 a.alpha_composite(portrait,(pad,pad))
 halo=a.getchannel('A').filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.GaussianBlur(.5))
 sticker=Image.new('RGBA',a.size,(255,250,239,0))
 sticker.putalpha(halo)
 sticker.alpha_composite(a)
 sticker.save(assets/f'{name}.png',optimize=True)
 print(name,sticker.size,(assets/f'{name}.png').stat().st_size)

font=assets/'fredoka-semibold.ttf'
if not font.exists():
 urllib.request.urlretrieve('https://fonts.gstatic.com/s/fredoka/v17/X7nP4b87HvSqjb_WIi2yDCRwoQ_k7367_B-i2yQag0-mac3OLyXMFg.ttf',font)
print('Font',font.stat().st_size)
# A preview of the two standalone cut-outs, for quality control only.
out=Image.new('RGB',(900,600),'#f4dbcc')
for x,name in [(65,'yanivo'),(475,'elish')]:
 p=Image.open(assets/f'{name}.png');p.thumbnail((340,510))
 out.paste(p,(x+(340-p.width)//2,45),p)
out.save(ROOT/'tests'/'face-cutouts.jpg')
