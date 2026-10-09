// 기록 #118953 응답의 real_content 내부 HTML. 작성자/버튼/첨부 파일 영역은 본문에 포함하지 않는다.
export const legacyRecordContent = `<p><input name="ㅅㅎㄱㄹ온" type="checkbox" value="ㅇㄹ호" />ㅎ롱ㄹ홍ㄹ호</p>

<pre>
<code>ㅗㅎㄹ오ㅓㅇㄹ허ㅗㅇㅀ</code></pre>

<p><img src="/image/2176ac7aafbf042f.png" /></p>

<p>&nbsp;</p>

<p>&nbsp;</p>

<p>&nbsp;</p>

<div class="accordion-content">
<div class="accordion-button">제목</div>

<div class="accordion-item">
<p>내용</p>
</div>
</div>

<p>&nbsp;</p>

<table border="1" cellpadding="1" cellspacing="1" style="width:500px">
	<tbody>
		<tr>
			<td>ㅎ&nbsp; &nbsp; ㅓㅏ&nbsp;&nbsp;&nbsp;&nbsp;</td>
			<td>ㅎㄹㅇㄴ</td>
		</tr>
		<tr>
			<td>ㅀ오ㅓ</td>
			<td>ㅎㄹ오ㅓ</td>
		</tr>
		<tr>
			<td>ㅎㄹ오ㅓ</td>
			<td>ㅎㄹ오</td>
		</tr>
	</tbody>
</table>

<p>ㅀ오</p>

<p>ㅎㄹ오ㅓ</p>

<p>&nbsp;</p>

<hr />
<p>&nbsp;</p>

<p><img alt="sad" height="23" src="https://khlug.org/ckeditor/plugins/smiley/images/sad_smile.png" title="sad" width="23" /></p>

<p><iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="" frameborder="0" height="315" referrerpolicy="strict-origin-when-cross-origin" src="https://www.youtube.com/embed/S6zy8gzXero?si=IrmW7R9QvhjfrTPd" title="YouTube video player" width="560"></iframe></p>

<p><img alt="fhjdhjs" src="https://fxtex.codecogs.com/gif.latex?fhjdhjs" /></p>

<p>&nbsp;</p>

<p><a href="https://www.youtube.com/watch?v=S6zy8gzXero">tgrfhj</a></p>

<p>&nbsp;</p>

<h1>제목 1</h1>

<h2>제목 2</h2>

<h3>제목 3</h3>

<h4>제목 4</h4>

<h5>제목 5</h5>

<h6>제목 6</h6>

<p>일반 문단입니다. <strong>굵게</strong>, <em>기울임</em>, <u>밑줄</u>, <s>취소선</s>, 하이라이트, <code>인라인 코드</code>, 위첨자 x<sup>2</sup>, 아래첨자 H<sub>2</sub>O, <a href="https://example.com" rel="noopener noreferrer nofollow" target="_blank">링크</a>, <span style="color:#1abc9c">글자색</span>, <span style="background-color:#c0392b">배경색</span>, 인라인 수식 를 한 줄에 담았습니다.</p>

<p>가운데 정렬 문단</p>

<p>오른쪽 정렬 문단</p>

<p>양쪽 정렬 문단입니다. 줄이 길어져서 여러 줄로 넘어가야 정렬 차이가 보이므로 문장을 조금 길게 이어 씁니다. 줄이 길어져서 여러 줄로 넘어가야 정렬 차이가 보입니다.</p>

<ul>
	<li>
	<p>글머리 목록 1</p>
	</li>
	<li>
	<p>글머리 목록 2</p>

	<ul>
		<li>
		<p>중첩 항목</p>
		</li>
	</ul>
	</li>
</ul>

<ol>
	<li>
	<p>순서 목록 1</p>
	</li>
	<li>
	<p>순서 목록 2</p>
	</li>
</ol>

<ul>
	<li data-checked="true" data-type="taskItem"><input checked="checked" type="checkbox" />
	<p>완료한 할 일</p>
	</li>
	<li data-checked="false" data-type="taskItem"><input type="checkbox" />
	<p>남은 할 일</p>
	</li>
</ul>

<blockquote>
<p>인용문입니다.</p>

<blockquote>
<p>중첩 인용문입니다.</p>
</blockquote>
</blockquote>

<p>&nbsp;</p>

<ol>
	<li>yiug</li>
	<li>yuiol;
	<ul>
		<li>yujrtn</li>
		<li>ukjy</li>
	</ul>
	</li>
</ol>

<p>&nbsp;</p>`;

// 첨부 파일 링크는 real_content 밖의 download 영역으로 응답된다.
export const legacyRecordAttachments = `<div class="download">
<a href="https://khlug.org/file/9966ac7aab9d69c2"><i class="xi-download"></i> 8215315.png (4.72 KB)</a><br />
</div>`;
