import { coverStyle } from '../utils/bookUi'

/**
 * 侧边上架图书封面循环墙。
 *
 * @param props 组件参数
 * @return JSX.Element
 */
function SideBookMarquee({ books, side }) {
  const loopBooks = books.length ? [...books, ...books] : []

  return (
    <div className={`side-blank-card side-book-marquee side-book-marquee-${side}`} aria-label={`${side === 'left' ? '左侧' : '右侧'}上架图书封面`}>
      {loopBooks.length ? (
        <div className="side-book-track">
          {loopBooks.map((book, index) => (
            <div
              className="side-book-cover"
              key={`${side}-${book.id || book.title}-${index}`}
              style={{ backgroundImage: coverStyle(book.coverUrl, book.title) }}
              title={book.title}
            />
          ))}
        </div>
      ) : (
        <div className="side-book-empty">暂无上架图书</div>
      )}
    </div>
  )
}

export default SideBookMarquee
